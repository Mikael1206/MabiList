import assert from "node:assert/strict";
import test from "node:test";
import { getSession } from "./session.mjs";

const env = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "public-key" };
const ownerId = "11111111-1111-4111-8111-111111111111";

test("missing bearer token is refused before any upstream call", async () => {
  const result = await getSession(undefined, env, () => { throw new Error("must not call"); });
  assert.equal(result.status, 401);
  assert.equal(result.body.error.code, "UNAUTHENTICATED");
});

test("invalid token is refused without reading a profile", async () => {
  const calls = [];
  const result = await getSession("Bearer invalid", env, (url) => {
    calls.push(url.pathname);
    return Promise.resolve({ status: 401 });
  });
  assert.equal(result.status, 401);
  assert.deepEqual(calls, ["/auth/v1/user"]);
});

test("verified identity determines the profile lookup", async () => {
  const calls = [];
  const result = await getSession("Bearer owner-token", env, async (url, options) => {
    calls.push({ url, headers: options.headers });
    if (url.pathname === "/auth/v1/user") {
      return { ok: true, json: async () => ({ id: ownerId, email: "owner@example.com" }) };
    }
    return { ok: true, json: async () => [{ shop_name: "My Shop" }] };
  });

  assert.deepEqual(result, { status: 200, body: { email: "owner@example.com", shop_name: "My Shop" } });
  assert.equal(calls[1].url.searchParams.get("owner_id"), `eq.${ownerId}`);
  assert.equal(calls[0].headers.Authorization, "Bearer owner-token");
  assert.equal(calls[1].headers.Authorization, "Bearer owner-token");
});

test("upstream failures never expose provider details", async () => {
  const result = await getSession("Bearer owner-token", env, async () => {
    throw new Error("private provider error");
  });
  assert.equal(result.status, 500);
  assert.equal(result.body.error.code, "INTERNAL_ERROR");
  assert.doesNotMatch(JSON.stringify(result.body), /private provider error/);
});

test("shop name update validates input and writes only the verified owner's profile", async () => {
  const { updateShopName } = await import("./session.mjs");
  const id = "11111111-1111-4111-8111-111111111111";
  const env = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "public" };
  const bad = await updateShopName("Bearer t", { shop_name: "  " }, env, async () => { throw new Error("no call"); });
  assert.equal(bad.status, 400);
  const seen = [];
  const result = await updateShopName("Bearer t", { shop_name: " Mila's " }, env, async (url, options = {}) => {
    seen.push(`${options.method ?? "GET"} ${url}`);
    if (String(url).endsWith("/auth/v1/user")) return { ok: true, status: 200, json: async () => ({ id, email: "a@b.co" }) };
    return { ok: true, status: 200, json: async () => [{ shop_name: JSON.parse(options.body).shop_name }] };
  });
  assert.deepEqual(result.body, { email: "a@b.co", shop_name: "Mila's" });
  assert.match(seen[1], new RegExp(`^PATCH .*owner_id=eq.${id}`));
});
