import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";
import { handleExtraction } from "./extractions.mjs";

function makeRequest({ method = "POST", url = "/api/extractions", body = { kind: "text", text: "Buyer: 2 brownies" }, headers = {} } = {}) {
  const stream = Readable.from([Buffer.from(typeof body === "string" ? body : JSON.stringify(body))]);
  stream.method = method;
  stream.url = url;
  stream.headers = headers;
  return stream;
}

test("text extraction rejects missing auth and accepts a valid request", async () => {
  const missing = await handleExtraction(makeRequest({ headers: {} }));
  assert.equal(missing.status, 401);
  assert.equal(missing.body.error.code, "UNAUTHENTICATED");

  const valid = await handleExtraction(makeRequest({
    headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
    body: { kind: "text", text: "Buyer: 2 brownies, total is 500" },
  }));

  assert.equal(valid.status, 200);
  assert.equal(valid.body.status, "draft_ready");
  assert.equal(valid.body.upload.kind, "text");
  assert.ok(Array.isArray(valid.body.drafts));
  assert.equal(valid.body.drafts.length > 0, true);
});

test("empty or unreadable input returns no_order or validation errors", async () => {
  const empty = await handleExtraction(makeRequest({
    headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
    body: { kind: "text", text: "hello po, magkano?" },
  }));
  assert.equal(empty.status, 200);
  assert.equal(empty.body.status, "no_order");

  const invalid = await handleExtraction(makeRequest({
    headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
    body: { kind: "image" },
  }));
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error.code, "VALIDATION_ERROR");
});
