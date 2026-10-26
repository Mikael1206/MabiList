import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";
import { handleOrders } from "./orders.mjs";

const ownerId = "11111111-1111-4111-8111-111111111111";
const env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "public-key",
  EXPIRE_UPLOADS_SECRET: "demo-secret",
};

function request(method, url, body, headers = {}) {
  const stream = Readable.from([Buffer.from(body ? JSON.stringify(body) : "")]);
  stream.method = method;
  stream.url = url;
  stream.headers = headers;
  return stream;
}

const reply = (data, status = 200) => ({ ok: status < 400, status, json: async () => data, headers: { get: () => null } });

test("manual order creation stores the authenticated owner data and item rows", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    const path = new URL(url).pathname;
    calls.push({ path, options });
    if (path === "/auth/v1/user") {
      return reply({ id: ownerId, email: "owner@example.com" });
    }
    if (path === "/rest/v1/orders") {
      return reply([{ id: "ord-1", owner_id: ownerId, customer_name: "Lyn Ramos", total_php: 600, delivery_date: "2026-10-21", payment_status: "not_stated", state: "confirmed", confirmed_at: "2026-10-20T10:00:00Z" }]);
    }
    if (path === "/rest/v1/order_items") {
      return reply([{ id: "item-1", order_id: "ord-1", owner_id: ownerId, name: "Brownie box", quantity: 2, unit_price_php: null }]);
    }
    throw new Error(`Unexpected ${path}`);
  };

  const result = await handleOrders(
    request(
      "POST",
      "/api/orders",
      {
        customer_name: "Lyn Ramos",
        items: [{ name: "Brownie box", quantity: 2, unit_price_php: null }],
        total_php: 600,
        delivery_date: "2026-10-21",
        payment_status: "not_stated",
      },
      { authorization: "Bearer owner-token", "content-type": "application/json" },
    ),
    env,
    fetchImpl,
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.order.customer_name, "Lyn Ramos");
  assert.equal(result.body.order.items[0].name, "Brownie box");
  assert.equal(calls[0].path, "/auth/v1/user");
});

test("delete route rejects unauthenticated requests and removes a draft for the signed-in owner", async () => {
  const fetchImpl = async (url) => {
    const path = new URL(url).pathname;
    if (path === "/auth/v1/user") {
      return reply({ id: ownerId, email: "owner@example.com" });
    }
    if (path === "/rest/v1/orders") {
      return reply([]);
    }
    throw new Error(`Unexpected ${path}`);
  };

  const missing = await handleOrders(request("DELETE", "/api/orders/22222222-2222-4222-8222-222222222222", undefined, {}), env, fetchImpl);
  assert.equal(missing.status, 401);

  const deleted = await handleOrders(
    request("DELETE", "/api/orders/22222222-2222-4222-8222-222222222222", undefined, { authorization: "Bearer owner-token" }),
    env,
    fetchImpl,
  );
  assert.equal(deleted.status, 204);
  assert.equal(deleted.body, undefined);
});

test("expire uploads route checks the shared secret before deleting stale uploads", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    const path = new URL(url).pathname;
    calls.push({ path, options });
    if (path === "/rest/v1/uploads") {
      return reply([{ id: "upload-1", owner_id: ownerId, status: "expired" }]);
    }
    throw new Error(`Unexpected ${path}`);
  };

  const unauthenticated = await handleOrders(
    request("POST", "/api/jobs/expire-uploads", {}, { "x-job-secret": "wrong-secret" }),
    env,
    fetchImpl,
  );
  assert.equal(unauthenticated.status, 401);

  const result = await handleOrders(
    request("POST", "/api/jobs/expire-uploads", {}, { "x-job-secret": "demo-secret" }),
    env,
    fetchImpl,
  );
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { ok: true, expired: 1 });
});
