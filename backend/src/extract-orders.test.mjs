import assert from 'node:assert/strict';
import test from 'node:test';
import { extractOrders } from './extract-orders.mjs';

const result = { orders: [{ customer_name: null, items: [], total_php: null, delivery_date: null, payment_status: 'not_stated' }] };
const image = Buffer.from('synthetic-image');

test('Gemini sends inline PNG with server key and reads JSON reply', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(result) }] } }] }) };
  };
  assert.deepEqual(await extractOrders({ images: [image] }, { provider: 'gemini', geminiApiKey: 'test-key', fetchImpl }), result);
  assert.match(request.url, /gemini-3\.8-flash:generateContent$/);
  assert.equal(request.options.headers['x-goog-api-key'], 'test-key');
  const body = JSON.parse(request.options.body);
  assert.equal(body.contents[0].parts[1].inlineData.data, image.toString('base64'));
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
});

test('Cloudflare sends one image with server token and reads JSON reply', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ success: true, result: { response: JSON.stringify(result) } }) };
  };
  assert.deepEqual(await extractOrders({ images: [image] }, {
    provider: 'cloudflare', cloudflareAccountId: 'account', cloudflareAuthToken: 'test-token', fetchImpl,
  }), result);
  assert.match(request.url, /llama-3\.2-11b-vision-instruct$/);
  assert.equal(request.options.headers.authorization, 'Bearer test-token');
  assert.equal(JSON.parse(request.options.body).image, `data:image/png;base64,${image.toString('base64')}`);
});

test('provider failures and invalid JSON do not become extraction results', async () => {
  await assert.rejects(
    extractOrders({ text: 'synthetic' }, { provider: 'gemini', geminiApiKey: 'test', fetchImpl: async () => ({ ok: false, status: 429 }) }),
    /Provider HTTP 429/,
  );
  await assert.rejects(
    extractOrders({ text: 'synthetic' }, { provider: 'cloudflare', cloudflareAccountId: 'a', cloudflareAuthToken: 't', fetchImpl: async () => ({ ok: true, json: async () => ({ result: { response: 'not JSON' } }) }) }),
    SyntaxError,
  );
});
