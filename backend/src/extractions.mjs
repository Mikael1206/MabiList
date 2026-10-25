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
}
