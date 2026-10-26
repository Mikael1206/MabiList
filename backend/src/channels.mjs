import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { randomUUID } from "node:crypto";
import { extractOrders } from "./extract-orders.mjs";

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

const logbookSubscribers = new Map();

export function broadcastLogbookUpdate(ownerId, eventName, payload = {}) {
  const subscribers = logbookSubscribers.get(ownerId);
  if (!subscribers || subscribers.size === 0) return 0;

  const message = `event: ${eventName}\ndata: ${JSON.stringify({ owner_id: ownerId, type: eventName, payload })}\n\n`;
  let delivered = 0;

  for (const response of Array.from(subscribers)) {
    try {
      response.write(message);
      delivered += 1;
    } catch {
      subscribers.delete(response);
    }
  }

  if (subscribers.size === 0) {
    logbookSubscribers.delete(ownerId);
  }

  return delivered;
}

export async function subscribeLogbook(request, response, env = process.env, fetchImpl = fetch) {
  const owner = await ownerFromRequest(request, env, fetchImpl);
  if (!owner) {
    response.writeHead(401);
    response.end(JSON.stringify({ error: { code: "UNAUTHENTICATED", message: "Please sign in." } }));
    return;
  }

  response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  response.writeHead(200);
  response.write(`event: connected\ndata: ${JSON.stringify({ owner_id: owner.id, connected: true })}\n\n`);

  const subscribers = logbookSubscribers.get(owner.id) ?? new Set();
  subscribers.add(response);
  logbookSubscribers.set(owner.id, subscribers);

  request.on("close", () => {
    const current = logbookSubscribers.get(owner.id);
    if (!current) return;
    current.delete(response);
    if (current.size === 0) {
      logbookSubscribers.delete(owner.id);
    }
  });
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

async function deleteOwnerData({ env, fetchImpl, ownerId }) {
  const serviceHeaders = {
    apikey: env.SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}`,
  };

  const conversationsUrl = new URL("/rest/v1/conversations", env.SUPABASE_URL);
  conversationsUrl.searchParams.set("select", "id");
  conversationsUrl.searchParams.set("owner_id", `eq.${ownerId}`);
  const conversationsResponse = await fetchImpl(conversationsUrl, { headers: serviceHeaders });
  if (!conversationsResponse.ok) throw new Error("Failed to fetch conversations for owner cleanup");
  const conversations = await conversationsResponse.json();
  const conversationIds = Array.isArray(conversations) ? conversations.map((conversation) => conversation.id).filter(Boolean) : [];

  const messageUrl = new URL("/rest/v1/chat_messages", env.SUPABASE_URL);
  messageUrl.searchParams.set("select", "id");
  messageUrl.searchParams.set("owner_id", `eq.${ownerId}`);
  if (conversationIds.length > 0) {
    messageUrl.searchParams.set("conversation_id", `in.(${conversationIds.join(",")})`);
  }
  const messagesResponse = await fetchImpl(messageUrl, { headers: serviceHeaders });
  if (!messagesResponse.ok) throw new Error("Failed to fetch chat messages for owner cleanup");
  const chatMessages = await messagesResponse.json();
  const removed = Array.isArray(chatMessages) ? chatMessages.length : 0;

  if (conversationIds.length > 0) {
    const deleteMessagesUrl = new URL("/rest/v1/chat_messages", env.SUPABASE_URL);
    deleteMessagesUrl.searchParams.set("owner_id", `eq.${ownerId}`);
    deleteMessagesUrl.searchParams.set("conversation_id", `in.(${conversationIds.join(",")})`);
    await fetchImpl(deleteMessagesUrl, {
      method: "DELETE",
      headers: serviceHeaders,
    });

    const deleteConversationsUrl = new URL("/rest/v1/conversations", env.SUPABASE_URL);
    deleteConversationsUrl.searchParams.set("owner_id", `eq.${ownerId}`);
    await fetchImpl(deleteConversationsUrl, {
      method: "DELETE",
      headers: serviceHeaders,
    });
  }

  const deleteOwnerMessagesUrl = new URL("/rest/v1/chat_messages", env.SUPABASE_URL);
  deleteOwnerMessagesUrl.searchParams.set("owner_id", `eq.${ownerId}`);
  await fetchImpl(deleteOwnerMessagesUrl, {
    method: "DELETE",
    headers: serviceHeaders,
  });

  const deleteConnectionsUrl = new URL("/rest/v1/channel_connections", env.SUPABASE_URL);
  deleteConnectionsUrl.searchParams.set("owner_id", `eq.${ownerId}`);
  await fetchImpl(deleteConnectionsUrl, {
    method: "DELETE",
    headers: serviceHeaders,
  });

  const deleteSecretsUrl = new URL("/rest/v1/channel_secrets", env.SUPABASE_URL);
  deleteSecretsUrl.searchParams.set("owner_id", `eq.${ownerId}`);
  await fetchImpl(deleteSecretsUrl, {
    method: "DELETE",
    headers: serviceHeaders,
  });

  return { removed: removed || 0, owner_id: ownerId };
}

function verifyMetaSignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(`sha256=${expected}`, signature);
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

async function getConversationWithOwner({ env, fetchImpl, ownerId, conversationId }) {
  const url = new URL("/rest/v1/conversations", env.SUPABASE_URL);
  url.searchParams.set("select", "id,owner_id,connection_id,platform_thread_id,status,open_order_id,customer_name,window_start_at,last_message_at");
  url.searchParams.set("id", `eq.${conversationId}`);
  url.searchParams.set("owner_id", `eq.${ownerId}`);
  const response = await fetchImpl(url, { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}` } });
  if (!response.ok) throw new Error("Failed to fetch conversation");
  const rows = await response.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function getConversationMessages({ env, fetchImpl, conversationId }) {
  const url = new URL("/rest/v1/chat_messages", env.SUPABASE_URL);
  url.searchParams.set("select", "id,conversation_id,text,sent_at,platform_message_id");
  url.searchParams.set("conversation_id", `eq.${conversationId}`);
  url.searchParams.set("order", "sent_at.asc");
  const response = await fetchImpl(url, { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}` } });
  if (!response.ok) throw new Error("Failed to fetch chat messages");
  const rows = await response.json();
  return Array.isArray(rows) ? rows : [];
}

async function getConnection({ env, fetchImpl, ownerId, connectionId }) {
  const url = new URL("/rest/v1/channel_connections", env.SUPABASE_URL);
  url.searchParams.set("select", "id,owner_id,platform,external_id,status");
  url.searchParams.set("id", `eq.${connectionId}`);
  url.searchParams.set("owner_id", `eq.${ownerId}`);
  const response = await fetchImpl(url, { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}` } });
  if (!response.ok) throw new Error("Failed to fetch channel connection");
  const rows = await response.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function createConversationDraft({ env, fetchImpl, ownerId, conversation, chatText, orderData }) {
  const provider = env.AI_PROVIDER ?? "ollama";
  const extraction = await extractOrders(
    { text: chatText },
    {
      provider,
      ollamaBaseUrl: env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
      fetchImpl,
    },
  );

  const draft = extraction?.orders?.[0];
  if (!draft) {
    throw new Error("No order found in conversation extraction");
  }

  const orderBody = {
    owner_id: ownerId,
    upload_id: null,
    conversation_id: conversation.id,
    source: orderData.source,
    state: "draft",
    customer_name: draft.customer_name ?? null,
    total_php: typeof draft.total_php === "number" ? draft.total_php : null,
    delivery_date: draft.delivery_date ?? null,
    payment_status: draft.payment_status ?? "not_stated",
    delivery_status: "pending",
    not_in_chat: [],
    matches_order_id: null,
    is_sample: false,
    confirmed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const orderResponse = await fetchImpl(new URL("/rest/v1/orders", env.SUPABASE_URL), {
    method: "POST",
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}`, "content-type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(orderBody),
  });
  if (!orderResponse.ok) throw new Error("Failed to create order draft");
  const orderRows = await orderResponse.json();
  const createdOrder = Array.isArray(orderRows) && orderRows[0] ? orderRows[0] : { ...orderBody, id: randomUUID() };

  const mappedItems = (draft.items ?? []).map((item, index) => ({
    id: randomUUID(),
    order_id: createdOrder.id,
    owner_id: ownerId,
    name: String(item.name ?? "Order item").trim() || "Order item",
    quantity: Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1,
    unit_price_php: typeof item.unit_price_php === "number" && Number.isFinite(item.unit_price_php) ? item.unit_price_php : null,
    index,
  }));

  if (mappedItems.length) {
    const response = await fetchImpl(new URL("/rest/v1/order_items", env.SUPABASE_URL), {
      method: "POST",
      headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}`, "content-type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(mappedItems),
    });
    if (!response.ok) throw new Error("Failed to create order items");
  }

  const patchUrl = new URL("/rest/v1/conversations", env.SUPABASE_URL);
  patchUrl.searchParams.set("id", `eq.${conversation.id}`);
  const patchResponse = await fetchImpl(patchUrl, {
    method: "PATCH",
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ status: "draft_ready", failure_reason: null, updated_at: new Date().toISOString() }),
  });
  if (!patchResponse.ok) throw new Error("Failed to update conversation status");

  broadcastLogbookUpdate(ownerId, "conversation_status", {
    conversation_id: conversation.id,
    status: "draft_ready",
  });
  broadcastLogbookUpdate(ownerId, "draft_ready", {
    id: createdOrder.id ?? randomUUID(),
    source: orderData.source,
    conversation_id: conversation.id,
    customer_name: createdOrder.customer_name ?? draft.customer_name ?? null,
  });

  return { status: "draft_ready", order: { ...createdOrder, source: orderData.source, customer_name: createdOrder.customer_name ?? draft.customer_name ?? null }, createdAt: new Date().toISOString() };
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

    if (request.method === "POST" && url.pathname === "/api/webhooks/meta/data-deletion") {
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
      const payload = raw ? JSON.parse(raw) : {};
      const signature = request.headers["x-hub-signature-256"] ?? "";
      const secret = env.META_APP_SECRET ?? "";
      if (!verifyMetaSignature(raw, signature, secret)) {
        return error(401, "UNAUTHENTICATED", "Invalid Meta signature.");
      }
      const ownerId = typeof payload?.user_id === "string" ? payload.user_id : payload?.data?.user_id;
      if (!ownerId || !/^[0-9a-f-]{36}$/i.test(ownerId)) {
        return error(400, "INVALID_BODY", "Missing or invalid user id.");
      }
      const cleaned = await deleteOwnerData({ env, fetchImpl, ownerId });
      return { status: 200, body: { ok: true, removed: cleaned.removed, owner_id: ownerId } };
    }

    if (request.method === "DELETE" && /^\/api\/connections\/[0-9a-f-]{36}$/i.test(url.pathname)) {
      const owner = await ownerFromRequest(request, env, fetchImpl);
      if (!owner) return error(401, "UNAUTHENTICATED", "Please sign in.");
      const id = url.pathname.split("/").at(-1);
      const connection = await getConnection({ env, fetchImpl, ownerId: owner.id, connectionId: id });
      if (connection) {
        const conversationUrl = new URL("/rest/v1/conversations", env.SUPABASE_URL);
        conversationUrl.searchParams.set("select", "id");
        conversationUrl.searchParams.set("owner_id", `eq.${owner.id}`);
        conversationUrl.searchParams.set("connection_id", `eq.${connection.id}`);
        const conversationsResponse = await fetchImpl(conversationUrl, { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}` } });
        if (conversationsResponse.ok) {
          const rows = await conversationsResponse.json();
          const conversationIds = Array.isArray(rows) ? rows.map((row) => row.id).filter(Boolean) : [];
          if (conversationIds.length > 0) {
            const messagesUrl = new URL("/rest/v1/chat_messages", env.SUPABASE_URL);
            messagesUrl.searchParams.set("owner_id", `eq.${owner.id}`);
            messagesUrl.searchParams.set("conversation_id", `in.(${conversationIds.join(",")})`);
            await fetchImpl(messagesUrl, { method: "DELETE", headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}` } });
            const conversationsDeleteUrl = new URL("/rest/v1/conversations", env.SUPABASE_URL);
            conversationsDeleteUrl.searchParams.set("owner_id", `eq.${owner.id}`);
            conversationsDeleteUrl.searchParams.set("connection_id", `eq.${connection.id}`);
            await fetchImpl(conversationsDeleteUrl, { method: "DELETE", headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}` } });
          }
        }
      }
      await fetchImpl(new URL("/rest/v1/channel_connections", env.SUPABASE_URL), {
        method: "DELETE",
        headers: { ...owner.headers, "content-type": "application/json" },
        body: JSON.stringify({ id: `eq.${id}`, owner_id: `eq.${owner.id}` }),
      });
      return { status: 204 };
    }

    if (request.method === "POST" && /^\/api\/conversations\/[0-9a-f-]{36}\/retry$/i.test(url.pathname)) {
      const owner = await ownerFromRequest(request, env, fetchImpl);
      if (!owner) return error(401, "UNAUTHENTICATED", "Please sign in.");
      const conversationId = url.pathname.split("/").at(-2);
      const conversation = await getConversationWithOwner({ env, fetchImpl, ownerId: owner.id, conversationId });
      if (!conversation) return error(404, "NOT_FOUND", "Conversation not found.");

      const connection = await getConnection({ env, fetchImpl, ownerId: owner.id, connectionId: conversation.connection_id });
      const source = connection?.platform === "telegram" ? "telegram" : connection?.platform === "instagram" ? "instagram" : "messenger";
      const messages = await getConversationMessages({ env, fetchImpl, conversationId });
      const chatText = messages.map((message) => message.text || "").filter(Boolean).join("\n");
      if (!chatText) {
        return error(400, "VALIDATION_ERROR", "Conversation has no readable text.");
      }

      try {
        const result = await createConversationDraft({ env, fetchImpl, ownerId: owner.id, conversation, chatText, orderData: { source } });
        return { status: 200, body: result };
      } catch (errorCause) {
        return error(500, "INTERNAL_ERROR", errorCause?.message || "Could not retry this conversation.");
      }
    }

    if (request.method === "POST" && url.pathname === "/api/connections/telegram") {
      const owner = await ownerFromRequest(request, env, fetchImpl);
      if (!owner) return error(401, "UNAUTHENTICATED", "Please sign in.");
      const payload = await readBody(request);
      const token = typeof payload?.bot_token === "string" ? payload.bot_token : "";
      if (!token) return error(400, "INVALID_BODY", "Telegram bot token is required.");

      const connectionId = randomUUID();
      const connectionResponse = await fetchImpl(new URL("/rest/v1/channel_connections", env.SUPABASE_URL), {
        method: "POST",
        headers: { ...owner.headers, "content-type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          id: connectionId,
          owner_id: owner.id,
          platform: "telegram",
          external_id: `bot-${connectionId.slice(0, 8)}`,
          display_name: typeof payload?.display_name === "string" ? payload.display_name : "Telegram Bot",
          status: "active",
        }),
      });
      if (!connectionResponse.ok) throw new Error("Failed to create channel connection");
      const connection = (await connectionResponse.json())[0] ?? { id: connectionId, owner_id: owner.id, platform: "telegram", display_name: "Telegram Bot" };

      await fetchImpl(new URL("/rest/v1/channel_secrets", env.SUPABASE_URL), {
        method: "POST",
        headers: { ...owner.headers, "content-type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ connection_id: connection.id, access_token: token, webhook_secret: token }),
      });

      return { status: 200, body: { ok: true, connection } };
    }

    if (request.method === "POST" && url.pathname === "/api/logbook/notify") {
      const owner = await ownerFromRequest(request, env, fetchImpl);
      if (!owner) return error(401, "UNAUTHENTICATED", "Please sign in.");
      const payload = await readBody(request);
      const type = typeof payload?.type === "string" ? payload.type : "";
      if (!type) return error(400, "INVALID_BODY", "Event type is required.");

      const delivered = broadcastLogbookUpdate(owner.id, type, payload?.payload ?? {});
      return { status: 200, body: { ok: true, delivered, owner_id: owner.id } };
    }

    return error(404, "NOT_FOUND", "Route not found.");
  } catch (errorCause) {
    return error(500, "INTERNAL_ERROR", errorCause?.message || "Could not process this webhook.");
  }
}
