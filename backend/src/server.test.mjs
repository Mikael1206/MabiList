import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";

test("session route verifies a bearer token and returns only the owner's profile", async () => {
  const upstream = createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    if (request.headers.authorization !== "Bearer valid-token") {
      response.writeHead(401).end("{}");
    } else if (request.url === "/auth/v1/user") {
      response.end(JSON.stringify({ id: "11111111-1111-4111-8111-111111111111", email: "owner@example.com" }));
    } else if (request.url?.startsWith("/rest/v1/profiles?")) {
      response.end(JSON.stringify([{ shop_name: "My Shop" }]));
    } else {
      response.writeHead(404).end("{}");
    }
  });
  upstream.listen(0, "127.0.0.1");
  await once(upstream, "listening");

  const child = spawn(process.execPath, ["src/server.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: "0",
      SUPABASE_URL: `http://127.0.0.1:${upstream.address().port}`,
      SUPABASE_PUBLISHABLE_KEY: "public-key",
    },
  });

  try {
    const [chunk] = await once(child.stdout, "data");
    const port = Number(chunk.toString().match(/:(\d+)\n/)?.[1]);
    assert.ok(port > 0);
    const base = `http://127.0.0.1:${port}`;

    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);

    const missing = await fetch(`${base}/api/session`);
    assert.equal(missing.status, 401);
    assert.equal((await missing.json()).error.code, "UNAUTHENTICATED");

    const invalid = await fetch(`${base}/api/session`, { headers: { Authorization: "Bearer invalid" } });
    assert.equal(invalid.status, 401);

    const valid = await fetch(`${base}/api/session`, { headers: { Authorization: "Bearer valid-token" } });
    assert.equal(valid.status, 200);
    assert.equal(valid.headers.get("cache-control"), "no-store");
    assert.deepEqual(await valid.json(), { email: "owner@example.com", shop_name: "My Shop" });
  } finally {
    child.kill();
    upstream.close();
    await Promise.all([once(child, "exit"), once(upstream, "close")]);
  }
});

test("mock webhook accepts a signed demo payload and acknowledges it", async () => {
  const child = spawn(process.execPath, ["src/server.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, HOST: "127.0.0.1", PORT: "0" },
  });

  try {
    const [chunk] = await once(child.stdout, "data");
    const port = Number(chunk.toString().match(/:(\d+)\n/)?.[1]);
    assert.ok(port > 0);
    const base = `http://127.0.0.1:${port}`;

    const challenge = await fetch(`${base}/api/webhooks/mock?hub.mode=subscribe&hub.challenge=demo-challenge&hub.verify_token=demo-token`);
    assert.equal(challenge.status, 200);
    assert.equal(await challenge.text(), "demo-challenge");

    const posted = await fetch(`${base}/api/webhooks/mock`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-mock-secret": "demo-secret",
      },
      body: JSON.stringify({ text: "Buyer: 2 loaves" }),
    });

    assert.equal(posted.status, 200);
    assert.deepEqual(await posted.json(), {
      ok: true,
      source: "mock-webhook",
      text: "Buyer: 2 loaves",
    });
  } finally {
    child.kill();
    await once(child, "exit");
  }
});

test("order and expiry routes are routed through the backend with owner checks", async () => {
  const upstream = createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    const auth = request.headers.authorization ?? "";
    if (request.url === "/auth/v1/user" && auth !== "Bearer valid-token") {
      response.writeHead(401).end("{}");
      return;
    }
    if (request.url?.startsWith("/rest/v1/orders") && auth !== "Bearer valid-token") {
      response.writeHead(401).end("{}");
      return;
    }
    if (request.url?.startsWith("/rest/v1/order_items") && auth !== "Bearer valid-token") {
      response.writeHead(401).end("{}");
      return;
    }
    if (request.url?.startsWith("/rest/v1/uploads") && !["Bearer valid-token", "Bearer public-key"].includes(auth)) {
      response.writeHead(401).end("{}");
      return;
    }

    if (request.url === "/auth/v1/user") {
      response.end(JSON.stringify({ id: "11111111-1111-4111-8111-111111111111", email: "owner@example.com" }));
    } else if (request.url?.startsWith("/rest/v1/orders")) {
      if (request.method === "POST") {
        response.end(JSON.stringify([{ id: "ord-1", owner_id: "11111111-1111-4111-8111-111111111111", customer_name: "Lyn Ramos", total_php: 600, delivery_date: "2026-10-21", payment_status: "not_stated", state: "confirmed", confirmed_at: "2026-10-20T10:00:00Z" }]));
      } else if (request.method === "DELETE") {
        response.end(JSON.stringify([]));
      } else {
        response.writeHead(200).end(JSON.stringify([]));
      }
    } else if (request.url?.startsWith("/rest/v1/order_items")) {
      response.end(JSON.stringify([{ id: "item-1", order_id: "ord-1", owner_id: "11111111-1111-4111-8111-111111111111", name: "Brownie box", quantity: 2, unit_price_php: null }]));
    } else if (request.url?.startsWith("/rest/v1/uploads")) {
      response.end(JSON.stringify([{ id: "upload-1", owner_id: "11111111-1111-4111-8111-111111111111", status: "expired" }]));
    } else {
      response.writeHead(404).end("{}");
    }
  });
  upstream.listen(0, "127.0.0.1");
  await once(upstream, "listening");

  const child = spawn(process.execPath, ["src/server.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: "0",
      SUPABASE_URL: `http://127.0.0.1:${upstream.address().port}`,
      SUPABASE_PUBLISHABLE_KEY: "public-key",
      EXPIRE_UPLOADS_SECRET: "demo-secret",
    },
  });

  try {
    const [chunk] = await once(child.stdout, "data");
    const port = Number(chunk.toString().match(/:(\d+)\n/)?.[1]);
    assert.ok(port > 0);
    const base = `http://127.0.0.1:${port}`;

    const create = await fetch(`${base}/api/orders`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: "Bearer valid-token" },
      body: JSON.stringify({ customer_name: "Lyn Ramos", items: [{ name: "Brownie box", quantity: 2, unit_price_php: null }], total_php: 600, delivery_date: "2026-10-21", payment_status: "not_stated" }),
    });
    assert.equal(create.status, 200);
    assert.equal((await create.json()).order.customer_name, "Lyn Ramos");

    const remove = await fetch(`${base}/api/orders/11111111-1111-4111-8111-111111111111`, {
      method: "DELETE",
      headers: { Authorization: "Bearer valid-token" },
    });
    assert.equal(remove.status, 204);

    const expire = await fetch(`${base}/api/jobs/expire-uploads`, {
      method: "POST",
      headers: { "x-job-secret": "demo-secret" },
    });
    assert.equal(expire.status, 200);
    assert.deepEqual(await expire.json(), { ok: true, expired: 1 });
  } finally {
    child.kill();
    upstream.close();
    await Promise.all([once(child, "exit"), once(upstream, "close")]);
  }
});
