import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { Readable } from "node:stream";
import test from "node:test";
import { handleChannels } from "./channels.mjs";

const ownerId = "11111111-1111-4111-8111-111111111111";
const env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "public-key",
  META_VERIFY_TOKEN: "meta-demo-token",
  META_APP_SECRET: "meta-demo-secret",
  TELEGRAM_WEBHOOK_SECRET: "telegram-demo-secret",
};

function request(method, url, body, headers = {}) {
  const stream = Readable.from([Buffer.from(body ? JSON.stringify(body) : "")]);
  stream.method = method;
  stream.url = url;
  stream.headers = headers;
  return stream;
}

const reply = (data, status = 200) => ({ ok: status < 400, status, json: async () => data, headers: { get: () => null } });

function signMeta(payload, secret = "meta-demo-secret") {
  const hmac = createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
  return `sha256=${hmac}`;
}

test("meta handshake accepts the configured verify token and returns the challenge", async () => {
  const result = await handleChannels(
    request("GET", "/api/webhooks/meta?hub.mode=subscribe&hub.challenge=demo-challenge&hub.verify_token=meta-demo-token", undefined, {}),
    env,
    async () => {
      throw new Error("should not hit upstream for handshake");
    },
  );

  assert.equal(result.status, 200);
  assert.equal(result.body, "demo-challenge");
});

test("meta webhook rejects invalid signatures and records valid message payloads", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    const path = new URL(url).pathname;
    calls.push({ path, options });
    if (path === "/auth/v1/user") return reply({ id: ownerId, email: "owner@example.com" });
    if (path === "/rest/v1/conversations") return reply([{ id: "conv-1", owner_id: ownerId, channel: "meta", external_id: "page-123" }]);
    if (path === "/rest/v1/chat_messages") return reply([{ id: "msg-1", owner_id: ownerId, conversation_id: "conv-1", channel: "meta", text: "Buyer: 2 loaves" }]);
    if (path === "/rest/v1/channel_connections") return reply([{ id: "conn-1", owner_id: ownerId, channel: "meta", external_id: "page-123" }]);
    throw new Error(`Unexpected ${path}`);
  };

  const badPayload = {
    object: "page",
    entry: [{ changes: [{ value: { messages: [{ from: { id: "buyer-1" }, text: "Buyer: 2 loaves" }] } }] }],
  };

  const bad = await handleChannels(
    request("POST", "/api/webhooks/meta", badPayload, { "content-type": "application/json", "x-hub-signature-256": "sha256=bad" }),
    env,
    fetchImpl,
  );
  assert.equal(bad.status, 401);

  const good = await handleChannels(
    request("POST", "/api/webhooks/meta", badPayload, { "content-type": "application/json", "x-hub-signature-256": signMeta(badPayload) }),
    env,
    fetchImpl,
  );
  assert.equal(good.status, 200);
  assert.deepEqual(good.body, { ok: true, source: "meta" });
});

test("telegram webhook validates the shared secret and ingests chat text", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    const path = new URL(url).pathname;
    calls.push({ path, options });
    if (path === "/auth/v1/user") return reply({ id: ownerId, email: "owner@example.com" });
    if (path === "/rest/v1/channel_connections") return reply([{ id: "conn-2", owner_id: ownerId, channel: "telegram", external_id: "chat-42" }]);
    if (path === "/rest/v1/conversations") return reply([{ id: "conv-2", owner_id: ownerId, channel: "telegram", external_id: "chat-42" }]);
    if (path === "/rest/v1/chat_messages") return reply([{ id: "msg-2", owner_id: ownerId, conversation_id: "conv-2", channel: "telegram", text: "Buyer: 2 loaves" }]);
    throw new Error(`Unexpected ${path}`);
  };

  const payload = {
    update_id: 1,
    message: { message_id: 99, chat: { id: 42, type: "private" }, text: "Buyer: 2 loaves" },
  };

  const rejected = await handleChannels(
    request("POST", "/api/webhooks/telegram", payload, { "content-type": "application/json", "x-telegram-token": "wrong-token" }),
    env,
    fetchImpl,
  );
  assert.equal(rejected.status, 401);

  const accepted = await handleChannels(
    request("POST", "/api/webhooks/telegram", payload, { "content-type": "application/json", "x-telegram-token": "telegram-demo-secret" }),
    env,
    fetchImpl,
  );
  assert.equal(accepted.status, 200);
  assert.deepEqual(accepted.body, { ok: true, source: "telegram" });
});

test("channel expiry job and disconnect route clean up owner-scoped records", async () => {
  const fetchImpl = async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path === "/auth/v1/user") return reply({ id: ownerId, email: "owner@example.com" });
    if (path === "/rest/v1/chat_messages") {
      if (options.method === "DELETE") return reply([]);
      return reply([{ id: "msg-3", owner_id: ownerId, conversation_id: "conv-3", text: "Old message", expires_at: "2026-10-01T00:00:00Z" }]);
    }
    if (path === "/rest/v1/channel_connections") {
      if (options.method === "DELETE") return reply([]);
      return reply([{ id: "conn-3", owner_id: ownerId, platform: "telegram", external_id: "chat-99", status: "active" }]);
    }
    if (path === "/rest/v1/conversations") {
      if (options.method === "PATCH") return reply([{ id: "conv-3", owner_id: ownerId, status: "expired" }]);
      return reply([{ id: "conv-3", owner_id: ownerId, status: "pending" }]);
    }
    throw new Error(`Unexpected ${path}`);
  };

  const expired = await handleChannels(
    request("POST", "/api/jobs/expire-channel-data", {}, { "x-job-secret": "expire-demo-secret" }),
    { ...env, EXPIRE_CHANNEL_DATA_SECRET: "expire-demo-secret" },
    fetchImpl,
  );
  assert.equal(expired.status, 200);
  assert.deepEqual(expired.body, { ok: true, expired: 1 });

  const disconnected = await handleChannels(
    request("DELETE", "/api/connections/11111111-1111-4111-8111-111111111111", undefined, { authorization: "Bearer owner-token" }),
    env,
    fetchImpl,
  );
  assert.equal(disconnected.status, 204);
  assert.equal(disconnected.body, undefined);
});

test("connect routes validate ownership and store linked channel records", async () => {
  const fetchImpl = async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path === "/auth/v1/user") return reply({ id: ownerId, email: "owner@example.com" });
    if (path === "/rest/v1/channel_connections") {
      if (options.method === "POST") return reply([{ id: "conn-4", owner_id: ownerId, platform: "telegram", external_id: "bot-42", display_name: "Demo Bot", status: "active" }]);
      return reply([{ id: "conn-4", owner_id: ownerId, platform: "telegram", external_id: "bot-42", display_name: "Demo Bot", status: "active" }]);
    }
    if (path === "/rest/v1/channel_secrets") {
      return reply([{ id: "secret-1", connection_id: "conn-4", access_token: "token-abc" }]);
    }
    throw new Error(`Unexpected ${path}`);
  };

  const missing = await handleChannels(
    request("POST", "/api/connections/telegram", { bot_token: "token-abc" }, {}),
    env,
    fetchImpl,
  );
  assert.equal(missing.status, 401);

  const connected = await handleChannels(
    request("POST", "/api/connections/telegram", { bot_token: "token-abc", display_name: "Demo Bot" }, { authorization: "Bearer owner-token" }),
    env,
    fetchImpl,
  );
  assert.equal(connected.status, 200);
  assert.equal(connected.body.connection.platform, "telegram");
});
