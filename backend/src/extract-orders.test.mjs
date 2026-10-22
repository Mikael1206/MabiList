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
  assert.match(request.url, /gemini-3\.6-flash:generateContent$/);
  assert.equal(request.options.headers['x-goog-api-key'], 'test-key');
  const body = JSON.parse(request.options.body);
  assert.equal(body.contents[0].parts[1].inlineData.data, image.toString('base64'));
  assert.equal(body.generationConfig.responseFormat.text.mimeType, 'APPLICATION_JSON');
  assert.equal(body.generationConfig.responseFormat.text.schema.properties.orders.maxItems, 1);
  assert.deepEqual(body.generationConfig.responseFormat.text.schema.properties.orders.items.required,
    ['customer_name', 'items', 'total_php', 'delivery_date', 'payment_status']);
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
  const body = JSON.parse(request.options.body);
  assert.equal(body.image, `data:image/png;base64,${image.toString('base64')}`);
  assert.equal(body.response_format.type, 'json_schema');
  assert.equal(body.response_format.json_schema.properties.orders.maxItems, 1);
});

test('Cloudflare text extraction can select a text model without sending an image', async () => {
  let request;
  const model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ success: true, result: { response: JSON.stringify(result) } }) };
  };
  assert.deepEqual(await extractOrders({ text: 'Buyer: 2 loaves' }, {
    provider: 'cloudflare', cloudflareAccountId: 'account', cloudflareAuthToken: 'test-token', cloudflareModel: model, fetchImpl,
  }), result);
  assert.ok(request.url.endsWith(`/${model}`));
  const body = JSON.parse(request.options.body);
  assert.match(body.prompt, /Buyer: 2 loaves/);
  assert.equal('image' in body, false);
  assert.equal(body.response_format.type, 'json_schema');
});

test('Cloudflare accepts a structured object and rejects per-message orders', async () => {
  const options = { provider: 'cloudflare', cloudflareAccountId: 'account', cloudflareAuthToken: 'test-token' };
  assert.deepEqual(await extractOrders({ images: [image] }, {
    ...options, fetchImpl: async () => ({ ok: true, json: async () => ({ success: true, result: { response: result } }) }),
  }), result);
  await assert.rejects(extractOrders({ images: [image] }, {
    ...options, fetchImpl: async () => ({ ok: true, json: async () => ({ success: true, result: { response: result.orders } }) }),
  }), /invalid single-order extraction/);
});

test('Hugging Face extracts OCR text through its OpenAI-compatible endpoint', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(result) } }] }) };
  };
  assert.deepEqual(await extractOrders({ text: 'Buyer: 2 loaves' }, {
    provider: 'huggingface', huggingFaceToken: 'test-token', fetchImpl,
  }), result);
  assert.equal(request.url, 'https://router.huggingface.co/v1/chat/completions');
  assert.equal(request.options.headers.authorization, 'Bearer test-token');
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, 'Qwen/Qwen3-8B');
  assert.match(body.messages[0].content, /Buyer: 2 loaves/);
  assert.deepEqual(body.response_format, { type: 'json_object' });
  assert.equal('image' in body, false);
});

test('Hugging Face rejects image input and invalid extraction output', async () => {
  const options = { provider: 'huggingface', huggingFaceToken: 'test-token' };
  await assert.rejects(extractOrders({ images: [image] }, options), /OCR text only/);
  await assert.rejects(extractOrders({ text: 'synthetic' }, {
    ...options, fetchImpl: async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'not JSON' } }] }) }),
  }), /invalid JSON/);
});

test('provider failures and invalid JSON do not become extraction results', async () => {
  await assert.rejects(
    extractOrders({ text: 'synthetic' }, { provider: 'gemini', geminiApiKey: 'test', fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({}) }) }),
    /Provider HTTP 429/,
  );
  await assert.rejects(
    extractOrders({ text: 'synthetic' }, { provider: 'cloudflare', cloudflareAccountId: 'a', cloudflareAuthToken: 't', fetchImpl: async () => ({ ok: true, json: async () => ({ result: { response: 'not JSON' } }) }) }),
    /Provider returned invalid JSON/,
  );
});
