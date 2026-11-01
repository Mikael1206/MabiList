import { randomUUID } from 'node:crypto';
import { readScreenshotBytes } from '../eval/ocr.mjs';
import { extractOrders, validExtraction } from './extract-orders.mjs';

const model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const bucket = 'mabilist-uploads';
const maxBytes = 10 * 1024 * 1024;
const error = (status, code, message) => ({ status, body: { error: { code, message } } });
const publicUpload = ({ id, kind, status, failure_reason, created_at, expires_at }) =>
  ({ id, kind, status, failure_reason, created_at, expires_at });
const withoutOwner = ({ owner_id: _owner, ...row }) => row;

async function bodyBytes(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new RangeError('Upload is too large.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function owner(authorization, env, fetchImpl) {
  const token = /^Bearer ([^\s]+)$/.exec(authorization ?? '')?.[1];
  if (!token) return null;
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) throw new Error('Supabase not configured');
  const headers = { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` };
  const response = await fetchImpl(new URL('/auth/v1/user', env.SUPABASE_URL), { headers });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error('Auth unavailable');
  const user = await response.json();
  if (!/^[0-9a-f-]{36}$/i.test(user.id)) return null;
  return { id: user.id, headers };
}

async function db(env, headers, table, { method = 'GET', query = {}, body } = {}, fetchImpl) {
  const url = new URL(`/rest/v1/${table}`, env.SUPABASE_URL);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const response = await fetchImpl(url, { method, headers: { ...headers, 'content-type': 'application/json', Prefer: 'return=representation,count=exact' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  if (!response.ok) throw new Error(`Database ${table} request failed`);
  return { rows: await response.json(), count: Number(response.headers?.get('content-range')?.split('/')[1]) };
}

async function storage(env, headers, path, { method = 'GET', body } = {}, fetchImpl) {
  const suffix = method === 'GET' ? 'object/authenticated' : 'object';
  const url = new URL(`/storage/v1/${suffix}/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`, env.SUPABASE_URL);
  const response = await fetchImpl(url, { method, headers: { ...headers, ...(method === 'POST' ? { 'content-type': 'image/png', 'x-upsert': 'false' } : {}) },
    ...(body ? { body } : {}) });
  if (!response.ok) throw new Error('Private source request failed');
  return response;
}

async function reserveAttempt(env, user, fetchImpl) {
  const limit = Number(env.DAILY_EXTRACTION_LIMIT);
  if (!Number.isInteger(limit) || limit < 1) throw new Error('Daily cap not configured');
  const { rows: reserved } = await db(env, user.headers, 'rpc/reserve_extraction_attempt',
    { method: 'POST', body: { p_limit: limit } }, fetchImpl);
  return reserved === true;
}

function safeOrder(raw) {
  if (!validExtraction({ orders: [raw] })) throw new Error('Invalid extraction');
  const items = raw.items.filter((item) => item.name.trim());
  if (!items.length) return null;
  const customer_name = raw.customer_name && (/\d{7,}|\b(?:street|st\.|road|avenue|barangay|brgy)\b/i.test(raw.customer_name) ? null : raw.customer_name.trim());
  const money = (value) => value === null || (Number.isFinite(value) && value >= 0 && Math.abs(value * 100 - Math.round(value * 100)) < 1e-6);
  if (!money(raw.total_php) || items.some((item) => !money(item.unit_price_php))) throw new Error('Invalid money value');
  if (raw.delivery_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(raw.delivery_date)) throw new Error('Invalid date');
  return { ...raw, customer_name, items, not_in_chat: [
    ...(!customer_name ? ['customer_name'] : []),
    ...(items.some((item) => item.quantity === null || item.unit_price_php === null) ? ['items'] : []),
    ...(raw.total_php === null ? ['total_php'] : []),
    ...(raw.delivery_date === null ? ['delivery_date'] : []),
    ...(raw.payment_status === 'not_stated' ? ['payment_status'] : []),
  ] };
}

async function parseInput(request) {
  const bytes = await bodyBytes(request);
  const type = request.headers['content-type'] ?? '';
  if (type.startsWith('application/json')) {
    const value = JSON.parse(bytes.toString('utf8'));
    if (value?.kind !== 'text' || typeof value.text !== 'string' || !value.text.trim() || value.text.length > 30000) throw new TypeError('Enter chat text.');
    return { kind: 'text', text: value.text.trim(), files: [] };
  }
  if (type.startsWith('multipart/form-data')) {
    const form = await new Request('http://localhost/', { method: 'POST', headers: { 'content-type': type }, body: bytes }).formData();
    const files = form.getAll('files');
    if (form.get('kind') !== 'image' || !files.length || files.length > 5) throw new TypeError('Add up to five PNG screenshots.');
    const images = [];
    for (const file of files) {
      if (!(file instanceof File) || file.type !== 'image/png') throw new TypeError('Only PNG screenshots are accepted.');
      const image = Buffer.from(await file.arrayBuffer());
      if (!image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new TypeError('Invalid PNG screenshot.');
      images.push(image);
    }
    return { kind: 'image', files: images };
  }
  throw new TypeError('Use JSON text or multipart PNG input.');
}

async function processUpload(upload, input, user, env, fetchImpl, extractImpl, ocrImpl) {
  try {
    const text = input.kind === 'text' ? input.text : (await Promise.all(input.files.map(ocrImpl))).join('\n');
    if (!text.trim()) throw new Error('Unreadable screenshot');
    const result = await extractImpl({ text }, { provider: 'cloudflare', cloudflareModel: model });
    const order = safeOrder(result.orders[0]);
    if (!order) {
      for (const path of upload.image_paths) await storage(env, user.headers, path, { method: 'DELETE' }, fetchImpl);
      const { rows } = await db(env, user.headers, 'uploads', { method: 'PATCH', query: { id: `eq.${upload.id}`, owner_id: `eq.${user.id}` },
        body: { status: 'no_order', raw_text: null, image_paths: [], raw_deleted_at: new Date().toISOString() } }, fetchImpl);
      return { status: 200, body: { status: 'no_order', upload: publicUpload(rows[0]) } };
    }
    const { rows: orders } = await db(env, user.headers, 'orders', { method: 'POST', body: {
      owner_id: user.id, upload_id: upload.id, source: input.kind === 'text' ? 'paste' : 'screenshot', state: 'draft',
      customer_name: order.customer_name, total_php: order.total_php, delivery_date: order.delivery_date,
      payment_status: order.payment_status, not_in_chat: order.not_in_chat,
    } }, fetchImpl);
    const saved = orders[0];
    try {
      const { rows: items } = await db(env, user.headers, 'order_items', { method: 'POST', body: order.items.map((item) => ({
        ...item, order_id: saved.id, owner_id: user.id,
      })) }, fetchImpl);
      const { rows: uploads } = await db(env, user.headers, 'uploads', { method: 'PATCH', query: { id: `eq.${upload.id}`, owner_id: `eq.${user.id}` }, body: { status: 'draft_ready' } }, fetchImpl);
      const current = publicUpload(uploads[0]);
      return { status: 200, body: { status: 'draft_ready', upload: current,
        drafts: [{ ...withoutOwner(saved), items: items.map(withoutOwner), expires_at: current.expires_at }],
        source_preview: input.kind === 'text' ? { upload_id: upload.id, kind: 'text', text: input.text, expires_at: current.expires_at }
          : { upload_id: upload.id, kind: 'image', preview_path: `/api/uploads/${upload.id}/source`, expires_at: current.expires_at },
        field_evidence: [] } };
    } catch (cause) {
      await db(env, user.headers, 'orders', { method: 'DELETE', query: { id: `eq.${saved.id}`, owner_id: `eq.${user.id}` } }, fetchImpl);
      throw cause;
    }
  } catch (cause) {
    console.error(`Extraction ${upload.id} failed: ${cause?.message}`); // message only: never log chat text
    const { rows } = await db(env, user.headers, 'uploads', { method: 'PATCH', query: { id: `eq.${upload.id}`, owner_id: `eq.${user.id}` },
      body: { status: 'failed', failure_reason: 'Could not read this chat. Try again.' } }, fetchImpl);
    return { status: 200, body: { status: 'failed', upload: publicUpload(rows[0]) } };
  }
}

export async function handleExtraction(request, env = process.env, fetchImpl = fetch, extractImpl = extractOrders, ocrImpl = readScreenshotBytes) {
  try {
    const user = await owner(request.headers.authorization, env, fetchImpl);
    if (!user) return error(401, 'UNAUTHENTICATED', 'Please sign in.');
    const retryId = /^\/api\/extractions\/([0-9a-f-]{36})\/retry$/i.exec(request.url)?.[1];
    const previewId = /^\/api\/uploads\/([0-9a-f-]{36})\/source$/i.exec(request.url)?.[1];
    if (previewId && request.method === 'GET') {
      const { rows } = await db(env, user.headers, 'uploads', { query: { id: `eq.${previewId}`, owner_id: `eq.${user.id}`, select: '*' } }, fetchImpl);
      const upload = rows[0];
      if (!upload || upload.kind !== 'image' || !upload.image_paths?.length || new Date(upload.expires_at) <= new Date()) return error(404, 'NOT_FOUND', 'Source not available.');
      const source = await storage(env, user.headers, upload.image_paths[0], {}, fetchImpl);
      return { status: 200, binary: Buffer.from(await source.arrayBuffer()), contentType: 'image/png' };
    }
    if (request.method !== 'POST') return error(404, 'NOT_FOUND', 'Route not found.');
    if (retryId) {
      const { rows } = await db(env, user.headers, 'uploads', { query: { id: `eq.${retryId}`, owner_id: `eq.${user.id}`, select: '*' } }, fetchImpl);
      const upload = rows[0];
      if (!upload) return error(404, 'NOT_FOUND', 'Upload not found.');
      if (upload.status !== 'failed' || new Date(upload.expires_at) <= new Date()) return error(409, 'CONFLICT', 'This upload cannot be retried.');
      const input = upload.kind === 'text' ? { kind: 'text', text: upload.raw_text } : { kind: 'image', files: await Promise.all(upload.image_paths.map(async (path) => Buffer.from(await (await storage(env, user.headers, path, {}, fetchImpl)).arrayBuffer()))) };
      if (!input.text && !input.files?.length) return error(409, 'CONFLICT', 'Source is unavailable.');
      if (!await reserveAttempt(env, user, fetchImpl)) return error(429, 'RATE_LIMITED', 'Daily extraction limit reached.');
      await db(env, user.headers, 'uploads', { method: 'PATCH', query: { id: `eq.${upload.id}`, owner_id: `eq.${user.id}` }, body: { status: 'processing', failure_reason: null } }, fetchImpl);
      return processUpload(upload, input, user, env, fetchImpl, extractImpl, ocrImpl);
    }
    if (request.url !== '/api/extractions') return error(404, 'NOT_FOUND', 'Route not found.');
    let input;
    try { input = await parseInput(request); }
    catch { return error(400, 'VALIDATION_ERROR', 'Enter chat text or valid PNG screenshots.'); }
    if (!await reserveAttempt(env, user, fetchImpl)) return error(429, 'RATE_LIMITED', 'Daily extraction limit reached.');
    const id = randomUUID();
    const paths = input.files.map((_, index) => `${user.id}/${id}/${index + 1}.png`);
    const { rows } = await db(env, user.headers, 'uploads', { method: 'POST', body: {
      id, owner_id: user.id, kind: input.kind, raw_text: input.text ?? null, image_paths: paths,
    } }, fetchImpl);
    const upload = rows[0];
    try { for (let i = 0; i < paths.length; i++) await storage(env, user.headers, paths[i], { method: 'POST', body: input.files[i] }, fetchImpl); }
    catch {
      await db(env, user.headers, 'uploads', { method: 'PATCH', query: { id: `eq.${id}`, owner_id: `eq.${user.id}` }, body: { status: 'failed', failure_reason: 'Upload failed.' } }, fetchImpl);
      return error(500, 'INTERNAL_ERROR', 'Upload failed. Try again.');
    }
    return processUpload(upload, input, user, env, fetchImpl, extractImpl, ocrImpl);
  } catch { return error(500, 'INTERNAL_ERROR', 'Could not process this chat. Try again.'); }
}
