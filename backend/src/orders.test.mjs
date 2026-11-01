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

const orderId = "22222222-2222-4222-8222-222222222222";
const uploadId = "33333333-3333-4333-8333-333333333333";
const auth = { authorization: "Bearer owner-token", "content-type": "application/json" };
const draftRow = {
  id: orderId, owner_id: ownerId, upload_id: uploadId, state: "draft", customer_name: null, total_php: null,
  items: [{ id: "item-1", order_id: orderId, owner_id: ownerId, name: "Brownie box", quantity: null, unit_price_php: null }],
};
const input = { customer_name: " Lyn ", items: [{ name: "Brownie box", quantity: 2 }], total_php: null, delivery_date: "2026-11-02", payment_status: "paid" };

test("order list returns this owner's orders with items and no owner ids", async () => {
  const fetchImpl = async (url) => {
    const { pathname, searchParams } = new URL(url);
    if (pathname === "/auth/v1/user") return reply({ id: ownerId });
    assert.equal(searchParams.get("owner_id"), `eq.${ownerId}`);
    return reply([draftRow]);
  };
  const result = await handleOrders(request("GET", "/api/orders", undefined, auth), env, fetchImpl);
  assert.equal(result.status, 200);
  assert.equal(result.body.orders[0].owner_id, undefined);
  assert.equal(result.body.orders[0].items[0].owner_id, undefined);
});

test("confirm saves the owner's values, replaces items and deletes the raw screenshot", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const path = new URL(url).pathname;
    const method = options.method ?? "GET";
    calls.push(`${method} ${path}`);
    if (path === "/auth/v1/user") return reply({ id: ownerId });
    if (path === "/rest/v1/orders" && method === "GET") return reply([draftRow]);
    if (path === "/rest/v1/orders") return reply([{ ...draftRow, items: undefined, ...JSON.parse(options.body) }]);
    if (path === "/rest/v1/order_items" && method === "POST") return reply(JSON.parse(options.body));
    if (path === "/rest/v1/uploads" && method === "GET") return reply([{ image_paths: [`${ownerId}/${uploadId}/1.png`] }]);
    return reply([]);
  };
  const result = await handleOrders(request("POST", `/api/orders/${orderId}/confirm`, input, auth), env, fetchImpl);
  assert.equal(result.status, 200);
  assert.equal(result.body.order.state, "confirmed");
  assert.equal(result.body.order.customer_name, "Lyn");
  assert.deepEqual(result.body.order.not_in_chat, []);
  assert.equal(result.body.order.items[0].quantity, 2);
  assert.ok(calls.includes("DELETE /storage/v1/object/mabilist-uploads"));
  assert.ok(calls.includes("PATCH /rest/v1/uploads"));

  const again = await handleOrders(request("POST", `/api/orders/${orderId}/confirm`, input, auth), env, async (url) =>
    new URL(url).pathname === "/auth/v1/user" ? reply({ id: ownerId }) : reply([{ ...draftRow, state: "confirmed" }]));
  assert.equal(again.status, 409);
});

test("order writes reject invalid values before touching the database", async () => {
  const fetchImpl = async (url) => {
    if (new URL(url).pathname === "/auth/v1/user") return reply({ id: ownerId });
    throw new Error("unexpected database call");
  };
  const created = await handleOrders(request("POST", "/api/orders", { ...input, total_php: -5, items: [] }, auth), env, fetchImpl);
  assert.equal(created.status, 400);
  assert.deepEqual(Object.keys(created.body.error.fields).sort(), ["items", "total_php"]);
});
