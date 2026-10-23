import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { randomUUID } from "node:crypto";

function error(status, code, message) {
  return { status, body: { error: { code, message } } };
}

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const onData = (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        reject(new Error("Payload too large."));
        return;
      }
      chunks.push(Buffer.from(chunk));
    };
    const onEnd = () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON."));
      }
    };
    request.on("data", onData);
    request.on("end", onEnd);
    request.on("error", reject);
  });
}

function extractMetaPayload(payload) {
  const entry = payload?.entry ?? [];
  for (const item of entry) {
    const changes = item?.changes ?? [];
    for (const change of changes) {
      const value = change?.value ?? {};
      const messages = Array.isArray(value.messages) ? value.messages : [];
      for (const message of messages) {
        const senderId = message?.from?.id ?? message?.sender?.id ?? "unknown";
        const text = normalizeText(message?.message?.text ?? message?.text ?? "");
        if (text) return { externalId: String(senderId), text };
      }
    }
  }
  return null;
}

function extractTelegramPayload(payload) {
  const message = payload?.message ?? payload?.edited_message ?? payload?.callback_query?.message ?? null;
  if (!message) return null;
  const chatId = message?.chat?.id ?? payload?.chat_member?.chat?.id ?? "unknown";
  const text = normalizeText(message?.text ?? message?.caption ?? "");
  if (!text) return null;
  return { externalId: String(chatId), text };
}

async function persistChannelMessage({ env, fetchImpl, channel, externalId, text, payload }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
    return { ok: true };
  }

  const headers = { apiKey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}` };
  const connectionUrl = new URL("/rest/v1/channel_connections", env.SUPABASE_URL);
  connectionUrl.searchParams.set("select", "id,owner_id,channel,external_id");
  connectionUrl.searchParams.set("channel", `eq.${channel}`);
  connectionUrl.searchParams.set("external_id", `eq.${externalId}`);
  const connectionResponse = await fetchImpl(connectionUrl, { headers });
  if (!connectionResponse.ok) throw new Error("Failed to fetch channel connection");
  const connections = await connectionResponse.json();
  const ownerId = Array.isArray(connections) && connections[0]?.owner_id ? connections[0].owner_id : null;

  if (!ownerId) {
    return { ok: true };
  }

  const conversationUrl = new URL("/rest/v1/conversations", env.SUPABASE_URL);
  conversationUrl.searchParams.set("select", "id,owner_id,channel,external_id");
  conversationUrl.searchParams.set("owner_id", `eq.${ownerId}`);
  conversationUrl.searchParams.set("channel", `eq.${channel}`);
  conversationUrl.searchParams.set("external_id", `eq.${externalId}`);
  const conversationResponse = await fetchImpl(conversationUrl, { headers });
  if (!conversationResponse.ok) throw new Error("Failed to fetch conversation");
  const conversations = await conversationResponse.json();
  const conversationId = Array.isArray(conversations) && conversations[0]?.id ? conversations[0].id : randomUUID();

  if (!Array.isArray(conversations) || conversations.length === 0) {
    const createResponse = await fetchImpl(new URL("/rest/v1/conversations", env.SUPABASE_URL), {
      method: "POST",
      headers: { ...headers, "content-type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ id: conversationId, owner_id: ownerId, channel, external_id: externalId, status: "pending" }),
    });
    if (!createResponse.ok) throw new Error("Failed to create conversation");
  }

  const messageBody = {
    id: randomUUID(),
    owner_id: ownerId,
    conversation_id: conversationId,
    channel,
    external_id: externalId,
    sender: "customer",
    text,
    raw: payload,
    created_at: new Date().toISOString(),
  };

  const messageResponse = await fetchImpl(new URL("/rest/v1/chat_messages", env.SUPABASE_URL), {
    method: "POST",
    headers: { ...headers, "content-type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(messageBody),
  });
  if (!messageResponse.ok) throw new Error("Failed to create chat message");

  return { ok: true };
}

async function ownerFromRequest(request, env, fetchImpl) {
  const token = /^Bearer ([^\s]+)$/.exec(request.headers.authorization ?? "")?.[1];
  if (!token) return null;
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) throw new Error("Supabase not configured");
  const headers = { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` };
  const userResponse = await fetchImpl(new URL("/auth/v1/user", env.SUPABASE_URL), { headers });
  if (userResponse.status === 401 || userResponse.status === 403) return null;
  if (!userResponse.ok) throw new Error("Auth unavailable");
  const user = await userResponse.json();
  return /^[0-9a-f-]{36}$/i.test(user.id) ? { id: user.id, headers } : null;
}

export async function handleChannels(request, env = process.env, fetchImpl = fetch) {
  try {
    const url = new URL(request.url, `http://${request.headers.host ?? "127.0.0.1"}`);

    if (request.method === "GET" && url.pathname === "/api/webhooks/meta") {
      const mode = url.searchParams.get("hub.mode");
      const verifyToken = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      if (mode === "subscribe" && verifyToken === env.META_VERIFY_TOKEN && challenge) {
        return { status: 200, body: challenge };
      }
      return error(400, "INVALID_CHALLENGE", "Missing or invalid webhook challenge.");
    }

    if (request.method === "POST" && url.pathname === "/api/webhooks/meta") {
      const header = request.headers["x-hub-signature-256"];
      const raw = await new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        request.on("data", (chunk) => {
          size += chunk.length;
          if (size > 1024 * 1024) return reject(new Error("Payload too large."));
          chunks.push(Buffer.from(chunk));
        });
        request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        request.on("error", reject);
      });

      const secret = env.META_APP_SECRET ?? "";
      const computed = secret ? `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}` : "";

      if (!header || !safeEqual(computed, header)) {
        return error(401, "UNAUTHENTICATED", "Invalid Meta signature.");
      }

      const payload = raw ? JSON.parse(raw) : {};
      const message = extractMetaPayload(payload);
      if (message) {
        await persistChannelMessage({ env, fetchImpl, channel: "meta", externalId: message.externalId, text: message.text, payload });
      }
      return { status: 200, body: { ok: true, source: "meta" } };
    }

    if (request.method === "POST" && url.pathname === "/api/webhooks/telegram") {
      const token = request.headers["x-telegram-token"];
      const secret = env.TELEGRAM_WEBHOOK_SECRET ?? "";
      if (token !== secret) {
        return error(401, "UNAUTHENTICATED", "Invalid Telegram token.");
      }

      const payload = await readBody(request);
      const message = extractTelegramPayload(payload);
      if (message) {
        await persistChannelMessage({ env, fetchImpl, channel: "telegram", externalId: message.externalId, text: message.text, payload });
      }
      return { status: 200, body: { ok: true, source: "telegram" } };
    }

    if (request.method === "POST" && url.pathname === "/api/jobs/expire-channel-data") {
      const secret = request.headers["x-job-secret"];
      if (secret !== (env.EXPIRE_CHANNEL_DATA_SECRET ?? "")) {
        return error(401, "UNAUTHENTICATED", "Invalid job secret.");
      }

      const expiredUrl = new URL("/rest/v1/chat_messages", env.SUPABASE_URL);
      expiredUrl.searchParams.set("select", "id");
      expiredUrl.searchParams.set("expires_at", "lt.now()" );
      const expiredResponse = await fetchImpl(expiredUrl, { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}` } });
      if (!expiredResponse.ok) throw new Error("Failed to fetch expired messages");
      const expiredRows = await expiredResponse.json();
      const count = Array.isArray(expiredRows) ? expiredRows.length : 0;
      if (count > 0) {
        await fetchImpl(new URL("/rest/v1/chat_messages", env.SUPABASE_URL), {
          method: "DELETE",
          headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ expires_at: "lt.now()" }),
        });
      }
      return { status: 200, body: { ok: true, expired: count } };
    }

    if (request.method === "DELETE" && /^\/api\/connections\/[0-9a-f-]{36}$/i.test(url.pathname)) {
      const owner = await ownerFromRequest(request, env, fetchImpl);
      if (!owner) return error(401, "UNAUTHENTICATED", "Please sign in.");
      const id = url.pathname.split("/").at(-1);
      await fetchImpl(new URL("/rest/v1/channel_connections", env.SUPABASE_URL), {
        method: "DELETE",
        headers: { ...owner.headers, "content-type": "application/json" },
        body: JSON.stringify({ id: `eq.${id}`, owner_id: `eq.${owner.id}` }),
      });
      return { status: 204 };
    }

    return error(404, "NOT_FOUND", "Route not found.");
  } catch (errorCause) {
    return error(500, "INTERNAL_ERROR", errorCause?.message || "Could not process this webhook.");
  }
}
