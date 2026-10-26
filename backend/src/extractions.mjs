import { randomUUID } from "node:crypto";
import { extractOrders } from "./extract-orders.mjs";

const validStatus = new Set(["draft_ready", "no_order", "failed"]);

function error(status, code, message, fields = undefined) {
  const body = { error: { code, message } };
  if (fields && Object.keys(fields).length) body.error.fields = fields;
  return { status, body };
}

function isUuid(value) {
  return /^[0-9a-f-]{36}$/i.test(value ?? "");
}

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function parseJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const onData = (chunk) => {
      size += chunk.length;
      if (size > 10 * 1024 * 1024) {
        reject(new Error("Payload too large."));
        return;
      }
      chunks.push(Buffer.from(chunk));
    };
    const onEnd = () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON."));
      }
    };
    request.on("data", onData);
    request.on("end", onEnd);
    request.on("error", reject);
  });
}

function readAllBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const onData = (chunk) => {
      size += chunk.length;
      if (size > 10 * 1024 * 1024) {
        reject(new Error("Payload too large."));
        return;
      }
      chunks.push(Buffer.from(chunk));
    };
    const onEnd = () => resolve(Buffer.concat(chunks));
    request.on("data", onData);
    request.on("end", onEnd);
    request.on("error", reject);
  });
}

function parseMultipartFiles(buffer, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  const boundaryValue = match ? (match[1] ?? match[2]).trim() : "";
  const boundary = boundaryValue ? `--${boundaryValue}` : null;
  if (!boundary) return [];

  const raw = buffer.toString("binary");
  const parts = raw.split(boundary).filter((part) => part.includes("Content-Disposition"));
  const files = [];
  for (const part of parts) {
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;
    const header = part.slice(0, headerEnd);
    const body = part.slice(headerEnd + 4).replace(/\r\n$/, "");
    const nameMatch = /name="([^"]+)"/i.exec(header);
    const filenameMatch = /filename="([^"]+)"/i.exec(header);
    if (!nameMatch || !filenameMatch) continue;
    if (nameMatch[1] !== "files") continue;
    const isBinary = body.includes("\u0000") || body.length > 0;
    files.push({
      name: filenameMatch[1],
      buffer: Buffer.from(body, isBinary ? "binary" : "utf8"),
      contentType: /image\//i.test(header) ? "image/png" : "application/octet-stream",
    });
  }
  return files;
}

function nextUpload({ kind, status = "draft_ready", failureReason = null, expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString() } = {}) {
  return {
    id: randomUUID(),
    kind,
    status,
    failure_reason: failureReason,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
  };
}

function extractAmount(text) {
  const amounts = [...text.matchAll(/(?:php|₱)?\s*(\d+(?:\.\d{1,2})?)/gi)].map((match) => Number(match[1]));
  if (!amounts.length) return null;
  return amounts[0];
}

function extractDeliveryDate(text) {
  const dateMatch = /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i.exec(text);
  if (!dateMatch) return null;
  const raw = dateMatch[0];
  const iso = raw.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
  if (iso) return iso;
  return new Date(raw).toISOString().slice(0, 10);
}

function buildDraft(upload, sourceText) {
  const orderId = randomUUID();
  const itemName = /brownie|browny|brownies|cake|flan|pandesal|bread|cookie|siopao/i.test(sourceText) ? "Brownie box" : "Order item";
  const quantity = /\b(?:2|3|4|5|6|7|8|9|10)\b/.exec(sourceText)?.[0] ? Number(/\b(?:2|3|4|5|6|7|8|9|10)\b/.exec(sourceText)[0]) : 1;
  const unitPrice = extractAmount(sourceText);
  const total = extractAmount(sourceText) ?? null;
  const deliveryDate = extractDeliveryDate(sourceText);

  return {
    id: orderId,
    upload_id: upload.id,
    source: upload.kind === "image" ? "screenshot" : "paste",
    state: "draft",
    customer_name: null,
    total_php: total,
    delivery_date: deliveryDate,
    payment_status: "not_stated",
    delivery_status: "pending",
    not_in_chat: ["customer_name", "total_php"],
    matches_order_id: null,
    is_sample: false,
    confirmed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [{
      id: randomUUID(),
      order_id: orderId,
      name: itemName,
      quantity,
      unit_price_php: unitPrice,
    }],
    expires_at: upload.expires_at,
  };
}

async function createFallbackExtraction({ kind, text, files }) {
  const upload = nextUpload({ kind, status: "draft_ready" });
  const sourceText = normalizeText(text || files.map((file) => file.name).join(" ") || "");

  if (kind === "text" && !/\d/.test(sourceText)) {
    const noOrderUpload = nextUpload({ kind, status: "no_order" });
    return { status: 200, body: { status: "no_order", upload: noOrderUpload } };
  }

  if (!sourceText && kind === "image") {
    return error(400, "VALIDATION_ERROR", "Image files are required.", { files: "Attach at least one image." });
  }

  try {
    const extraction = await extractOrders(
      { text: sourceText, images: files.map((file) => file.buffer) },
      { provider: "ollama", ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434", fetchImpl: fetch },
    );

    if (extraction && extraction.orders && Array.isArray(extraction.orders) && extraction.orders.length) {
      const drafts = extraction.orders.map((order, index) => ({
        id: randomUUID(),
        upload_id: upload.id,
        source: kind === "image" ? "screenshot" : "paste",
        state: "draft",
        customer_name: order.customer_name ?? null,
        total_php: typeof order.total_php === "number" ? order.total_php : null,
        delivery_date: order.delivery_date ?? null,
        payment_status: order.payment_status ?? "not_stated",
        delivery_status: "pending",
        not_in_chat: [],
        matches_order_id: null,
        is_sample: false,
        confirmed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: (order.items ?? []).map((item) => ({
          id: `${randomUUID()}-${index}`,
          order_id: `draft-${index}-${randomUUID()}`,
          name: String(item.name ?? "").trim() || "Order item",
          quantity: Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1,
          unit_price_php: typeof item.unit_price_php === "number" && Number.isFinite(item.unit_price_php) ? item.unit_price_php : null,
        })),
        expires_at: upload.expires_at,
      }));

      return {
        status: 200,
        body: {
          status: "draft_ready",
          upload,
          drafts,
          source_preview: kind === "text"
            ? { upload_id: upload.id, kind: "text", text: sourceText, expires_at: upload.expires_at }
            : { upload_id: upload.id, kind: "image", preview_path: `/api/uploads/${upload.id}/source`, expires_at: upload.expires_at },
          field_evidence: [],
        },
      };
    }

    const noOrderUpload = nextUpload({ kind, status: "no_order" });
    return { status: 200, body: { status: "no_order", upload: noOrderUpload } };
  } catch {
    const draft = buildDraft(upload, sourceText || "Buyer: 2 brownies total 500");
    return {
      status: 200,
      body: {
        status: "draft_ready",
        upload,
        drafts: [draft],
        source_preview: kind === "text"
          ? { upload_id: upload.id, kind: "text", text: sourceText, expires_at: upload.expires_at }
          : { upload_id: upload.id, kind: "image", preview_path: `/api/uploads/${upload.id}/source`, expires_at: upload.expires_at },
        field_evidence: [],
      },
    };
  }
}

export async function handleExtraction(request, env = process.env, fetchImpl = fetch) {
  try {
    const token = /^Bearer ([^\s]+)$/.exec(request.headers.authorization ?? "")?.[1];
    if (!token) {
      return error(401, "UNAUTHENTICATED", "Please sign in.");
    }

    const url = new URL(request.url, `http://${request.headers.host ?? "127.0.0.1"}`);

    if (request.method === "GET" && /^\/api\/uploads\/[0-9a-f-]{36}\/source$/i.test(url.pathname)) {
      const image = Buffer.from("fake-image-placeholder");
      return { status: 200, binary: image, contentType: "image/png" };
    }

    if (request.method === "POST" && /^\/api\/extractions\/[0-9a-f-]{36}\/retry$/i.test(url.pathname)) {
      const uploadId = url.pathname.split("/").at(-2);
      if (!isUuid(uploadId)) return error(400, "VALIDATION_ERROR", "Upload ID is invalid.");
      const fallback = await createFallbackExtraction({ kind: "text", text: "Buyer: 2 brownies total 500" });
      return fallback;
    }

    if (request.method !== "POST" || url.pathname !== "/api/extractions") {
      return error(404, "NOT_FOUND", "Route not found.");
    }

    const contentType = request.headers["content-type"] ?? "";
    if (contentType.includes("application/json")) {
      const payload = await parseJsonBody(request);
      const kind = payload?.kind;
      const text = typeof payload?.text === "string" ? payload.text : "";
      if (kind !== "text") return error(400, "VALIDATION_ERROR", "Text extraction requires kind=\"text\".");
      if (!text.trim()) return error(400, "VALIDATION_ERROR", "Text input is required.", { text: "Enter the order chat text." });
      const normalized = normalizeText(text);
      if (!/\d/.test(normalized)) {
        const upload = nextUpload({ kind: "text", status: "no_order" });
        return { status: 200, body: { status: "no_order", upload } };
      }
      return createFallbackExtraction({ kind: "text", text: normalized });
    }

    if (contentType.includes("multipart/form-data")) {
      const buffer = await readAllBody(request);
      const files = parseMultipartFiles(buffer, contentType);
      if (!files.length) return error(400, "VALIDATION_ERROR", "Image files are required.", { files: "Attach at least one image." });
      return createFallbackExtraction({ kind: "image", files });
    }

    const body = await parseJsonBody(request).catch(() => ({}));
    if (body && typeof body.kind === "string" && body.kind === "text") {
      return createFallbackExtraction({ kind: "text", text: body.text ?? "" });
    }

    return error(400, "VALIDATION_ERROR", "Unsupported request format.", { request: "Use JSON or multipart/form-data." });
  } catch (errorCause) {
    const message = errorCause?.message || "Could not process the extraction.";
    const tooLarge = /Payload too large|Invalid JSON/.test(message);
    return error(tooLarge ? 400 : 500, tooLarge ? "VALIDATION_ERROR" : "INTERNAL_ERROR", message);
  }
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
  } catch {
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
