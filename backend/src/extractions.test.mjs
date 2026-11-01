import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import test from 'node:test';
import { handleExtraction } from './extractions.mjs';

const ownerId = '11111111-1111-4111-8111-111111111111';
const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public', DAILY_EXTRACTION_LIMIT: '5' };
const request = (body, authorization = 'Bearer token') => Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]), {
  method: 'POST', url: '/api/extractions', headers: { authorization, 'content-type': 'application/json' },
});
const reply = (data, status = 200, count = null) => ({ ok: status < 400, status, headers: { get: () => count === null ? null : `0-0/${count}` }, json: async () => data });

test('extraction authenticates before reading the request body', async () => {
  const body = Object.assign(Readable.from([]), { method: 'POST', url: '/api/extractions', headers: {} });
  const result = await handleExtraction(body, env, async () => { throw new Error('unexpected fetch'); });
  assert.equal(result.status, 401);
  assert.equal(result.body.error.code, 'UNAUTHENTICATED');
});

test('text extraction saves an owner-scoped draft with unknown quantity intact', async () => {
  const calls = [];
  const upload = { id: '22222222-2222-4222-8222-222222222222', owner_id: ownerId, kind: 'text', image_paths: [],
    raw_text: 'Buyer: one cake', status: 'processing', failure_reason: null, created_at: '2026-10-23T00:00:00Z', expires_at: '2026-10-30T00:00:00Z' };
  const fetchImpl = async (url, options) => {
    const path = new URL(url).pathname;
    calls.push({ path, options });
    if (path === '/auth/v1/user') return reply({ id: ownerId });
    if (path === '/rest/v1/rpc/reserve_extraction_attempt') return reply(true);
    if (path === '/rest/v1/uploads' && options.method === 'POST') return reply([upload]);
    if (path === '/rest/v1/orders') return reply([{ id: '33333333-3333-4333-8333-333333333333', state: 'draft', upload_id: upload.id }]);
    if (path === '/rest/v1/order_items') return reply([{ id: '44444444-4444-4444-8444-444444444444', quantity: null }]);
    if (path === '/rest/v1/uploads' && options.method === 'PATCH') return reply([{ ...upload, status: 'draft_ready' }]);
    throw new Error(`Unexpected ${path}`);
  };
  const extractImpl = async ({ text }, options) => {
    assert.equal(text, 'Buyer: one cake');
    assert.equal(options.cloudflareModel, '@cf/meta/llama-3.3-70b-instruct-fp8-fast');
    return { orders: [{ customer_name: null, items: [{ name: 'cake', quantity: null, unit_price_php: 0.29 }],
      total_php: null, delivery_date: null, payment_status: 'not_stated' }] };
  };
  const result = await handleExtraction(request({ kind: 'text', text: 'Buyer: one cake' }), env, fetchImpl, extractImpl);
  assert.equal(result.status, 200);
  assert.equal(result.body.status, 'draft_ready');
  assert.equal(result.body.drafts[0].items[0].quantity, null);
  const itemWrite = calls.find(({ path }) => path === '/rest/v1/order_items');
  assert.equal(JSON.parse(itemWrite.options.body)[0].quantity, null);
  assert.ok(calls.every(({ options }) => options.headers.Authorization === 'Bearer token'));
});

test('daily cap rejects an extraction before storing data or calling the model', async () => {
  const fetchImpl = async (url) => new URL(url).pathname === '/auth/v1/user' ? reply({ id: ownerId }) : reply(false);
  const result = await handleExtraction(request({ kind: 'text', text: 'Buyer: one cake' }), env, fetchImpl);
  assert.equal(result.status, 429);
  assert.equal(result.body.error.code, 'RATE_LIMITED');
});

test('PNG extraction stores a private owner path and passes OCR text to Cloudflare', async () => {
  const form = new FormData();
  form.set('kind', 'image');
  form.append('files', new File([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1])], 'chat.png', { type: 'image/png' }));
  const encoded = new Request('http://localhost/', { method: 'POST', body: form });
  const req = Object.assign(Readable.from([Buffer.from(await encoded.arrayBuffer())]), {
    method: 'POST', url: '/api/extractions', headers: { authorization: 'Bearer token', 'content-type': encoded.headers.get('content-type') },
  });
  let storedPath;
  const upload = { id: '22222222-2222-4222-8222-222222222222', owner_id: ownerId, kind: 'image', image_paths: [],
    status: 'processing', failure_reason: null, created_at: '2026-10-23T00:00:00Z', expires_at: '2026-10-30T00:00:00Z' };
  const fetchImpl = async (url, options) => {
    const path = new URL(url).pathname;
    if (path === '/auth/v1/user') return reply({ id: ownerId });
    if (path === '/rest/v1/rpc/reserve_extraction_attempt') return reply(true);
    if (path === '/rest/v1/uploads' && options.method === 'POST') return reply([{ ...upload, image_paths: JSON.parse(options.body).image_paths }]);
    if (path.startsWith('/storage/v1/object/')) { storedPath = path; return reply({}); }
    if (path === '/rest/v1/orders') return reply([{ id: '33333333-3333-4333-8333-333333333333', state: 'draft' }]);
    if (path === '/rest/v1/order_items') return reply([{ id: '44444444-4444-4444-8444-444444444444', name: 'cake', quantity: 1, unit_price_php: 200 }]);
    if (path === '/rest/v1/uploads' && options.method === 'PATCH') return reply([{ ...upload, status: 'draft_ready' }]);
    throw new Error(`Unexpected ${path}`);
  };
  const result = await handleExtraction(req, env, fetchImpl,
    async ({ text }) => { assert.equal(text, 'Buyer: 1 cake'); return { orders: [{ customer_name: null,
      items: [{ name: 'cake', quantity: 1, unit_price_php: 200 }], total_php: 200, delivery_date: null, payment_status: 'not_stated',
    }] }; },
    async () => 'Buyer: 1 cake');
  assert.equal(result.body.status, 'draft_ready');
  assert.match(storedPath, new RegExp(`^/storage/v1/object/mabilist-uploads/${ownerId}/`));
  assert.equal(result.body.source_preview.kind, 'image');
});

test('retry refuses an upload absent from the verified owner scope', async () => {
  const req = Object.assign(Readable.from([]), { method: 'POST',
    url: '/api/extractions/22222222-2222-4222-8222-222222222222/retry', headers: { authorization: 'Bearer token' } });
  let scoped = false;
  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    if (parsed.pathname === '/auth/v1/user') return reply({ id: ownerId });
    scoped = parsed.searchParams.get('owner_id') === `eq.${ownerId}`;
    return reply([]);
  };
  const result = await handleExtraction(req, env, fetchImpl, async () => { throw new Error('model called'); });
  assert.equal(result.status, 404);
  assert.equal(scoped, true);
});
