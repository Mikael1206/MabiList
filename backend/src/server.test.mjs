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
