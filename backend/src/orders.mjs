import { randomUUID } from "node:crypto";

function error(status, code, message) {
  return { status, body: { error: { code, message } } };
}

async function owner(authorization, env, fetchImpl) {
  const token = /^Bearer ([^\s]+)$/.exec(authorization ?? "")?.[1];
  if (!token) return null;
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) throw new Error("Supabase not configured");
  const headers = { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` };
  const userResponse = await fetchImpl(new URL("/auth/v1/user", env.SUPABASE_URL), { headers });
  if (userResponse.status === 401 || userResponse.status === 403) return null;
  if (!userResponse.ok) throw new Error("Auth unavailable");
  const user = await userResponse.json();
  if (!/^[0-9a-f-]{36}$/i.test(user.id)) return null;
  return { id: user.id, headers };
}

async function db(env, headers, table, { method = "GET", query = {}, body } = {}, fetchImpl) {
  const url = new URL(`/rest/v1/${table}`, env.SUPABASE_URL);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const response = await fetchImpl(url, {
    method,
    headers: { ...headers, "content-type": "application/json", Prefer: "return=representation,count=exact" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw new Error(`Database ${table} request failed`);
  return { rows: await response.json(), count: Number(response.headers?.get("content-range")?.split("/")[1]) };
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const onData = (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
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

const select = "*,items:order_items(*)";
const withoutOwner = ({ owner_id: _owner, ...row }) => row;
const toOrder = (row, items = row.items ?? []) => ({ ...withoutOwner(row), items: items.map(withoutOwner) });

const money = (value) => value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);
const rules = {
  customer_name: (value) => value === null || typeof value === "string",
  items: (value) =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 50 &&
    value.every((item) => typeof item?.name === "string" && item.name.trim() && Number.isInteger(item.quantity) && item.quantity > 0 && money(item.unit_price_php ?? null)),
  total_php: money,
  delivery_date: (value) => value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)),
  payment_status: (value) => ["unpaid", "paid", "not_stated"].includes(value),
  delivery_status: (value) => ["pending", "delivered"].includes(value),
};

/** Checks an OrderInput (all fields) or a PATCH body (only the fields sent). */
function validate(payload, partial) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { failure: error(400, "VALIDATION_ERROR", "Send the order as JSON.") };
  const keys = Object.keys(rules).filter((key) => (partial ? key in payload : key !== "delivery_status"));
  const bad = keys.filter((key) => !rules[key](payload[key]));
  if (bad.length) {
    const failure = error(400, "VALIDATION_ERROR", "Check the highlighted fields and try again.");
    failure.body.error.fields = Object.fromEntries(bad.map((key) => [key, "This value isn't valid."]));
    return { failure };
  }
  const { items, ...fields } = Object.fromEntries(keys.map((key) => [key, payload[key]]));
  if ("customer_name" in fields) fields.customer_name = fields.customer_name?.trim() || null;
  return { fields, items: items?.map((item) => ({ name: item.name.trim(), quantity: item.quantity, unit_price_php: item.unit_price_php ?? null })) };
}

async function findOrder(env, user, id, fetchImpl) {
  const { rows } = await db(env, user.headers, "orders", { query: { id: `eq.${id}`, owner_id: `eq.${user.id}`, select } }, fetchImpl);
  return rows[0] ?? null;
}

// shortcut: delete-then-insert is not atomic; a failed insert leaves the order without items. Move into a Postgres function if that shows up.
async function replaceItems(env, user, orderId, items, fetchImpl) {
  await db(env, user.headers, "order_items", { method: "DELETE", query: { order_id: `eq.${orderId}`, owner_id: `eq.${user.id}` } }, fetchImpl);
  const rows = items.map((item) => ({ ...item, id: randomUUID(), order_id: orderId, owner_id: user.id }));
  return rows.length ? (await db(env, user.headers, "order_items", { method: "POST", body: rows }, fetchImpl)).rows : [];
}

/** INV-001: once a draft is confirmed or deleted, its raw chat text and screenshots go. */
async function clearUpload(env, user, uploadId, fetchImpl) {
  const query = { id: `eq.${uploadId}`, owner_id: `eq.${user.id}` };
  const { rows } = await db(env, user.headers, "uploads", { query: { ...query, select: "image_paths" } }, fetchImpl);
  const paths = rows[0]?.image_paths ?? [];
  if (paths.length) {
    const response = await fetchImpl(new URL("/storage/v1/object/mabilist-uploads", env.SUPABASE_URL), {
      method: "DELETE",
      headers: { ...user.headers, "content-type": "application/json" },
      body: JSON.stringify({ prefixes: paths }),
    });
    if (!response.ok) throw new Error("Could not delete the screenshot");
  }
  await db(env, user.headers, "uploads", {
    method: "PATCH",
    query,
    body: { status: "consumed", raw_text: null, image_paths: [], raw_deleted_at: new Date().toISOString() },
  }, fetchImpl);
}

export async function handleOrders(request, env = process.env, fetchImpl = fetch) {
  try {
    const url = new URL(request.url, `http://${request.headers.host ?? "127.0.0.1"}`);

    if (request.method === "POST" && url.pathname === "/api/jobs/expire-uploads") {
      const secret = request.headers["x-job-secret"];
      if (secret !== env.EXPIRE_UPLOADS_SECRET) return error(401, "UNAUTHENTICATED", "Invalid job secret.");

      const serviceHeaders = env.SUPABASE_PUBLISHABLE_KEY
        ? { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}` }
        : {};
      const { rows } = await db(env, serviceHeaders, "uploads", { query: { status: "eq.expired", select: "id" } }, fetchImpl);
      return { status: 200, body: { ok: true, expired: rows.length } };
    }

    const match = /^\/api\/orders(?:\/([0-9a-f-]{36})(\/confirm)?)?$/i.exec(url.pathname);
    if (!match) return error(404, "NOT_FOUND", "Route not found.");
    const [, id, confirm] = match;
    const user = await owner(request.headers.authorization, env, fetchImpl);
    if (!user) return error(401, "UNAUTHENTICATED", "Please sign in.");
    const now = new Date().toISOString();

    if (request.method === "GET" && !id) {
      const { rows } = await db(env, user.headers, "orders", { query: { owner_id: `eq.${user.id}`, select, order: "created_at.desc" } }, fetchImpl);
      return { status: 200, body: { orders: rows.map((row) => toOrder(row)) } };
    }

    if (request.method === "GET" && id && !confirm) {
      const row = await findOrder(env, user, id, fetchImpl);
      return row ? { status: 200, body: { order: toOrder(row) } } : error(404, "NOT_FOUND", "We couldn't find that order. It may have been deleted.");
    }

    if (request.method === "DELETE" && id && !confirm) {
      const { rows } = await db(env, user.headers, "orders", { method: "DELETE", query: { id: `eq.${id}`, owner_id: `eq.${user.id}` } }, fetchImpl);
      const draft = rows.find((row) => row.state === "draft" && row.upload_id);
      if (draft) await clearUpload(env, user, draft.upload_id, fetchImpl);
      return { status: 204 };
    }

    if (request.method === "POST" && !id) {
      const { failure, fields, items } = validate(await parseBody(request).catch(() => null), false);
      if (failure) return failure;
      const order = { ...fields, id: randomUUID(), owner_id: user.id, source: "manual", state: "confirmed", delivery_status: "pending", confirmed_at: now };
      const { rows: savedOrders } = await db(env, user.headers, "orders", { method: "POST", body: order }, fetchImpl);
      const rows = items.map((item) => ({ ...item, id: randomUUID(), order_id: savedOrders[0].id, owner_id: user.id }));
      const { rows: savedItems } = await db(env, user.headers, "order_items", { method: "POST", body: rows }, fetchImpl);
      return { status: 200, body: { order: toOrder(savedOrders[0], savedItems) } };
    }

    if ((request.method === "PATCH" && id && !confirm) || (request.method === "POST" && confirm)) {
      const current = await findOrder(env, user, id, fetchImpl);
      if (!current) return error(404, "NOT_FOUND", "We couldn't find that order. It may have been deleted.");
      if (confirm && current.state !== "draft") return error(409, "CONFLICT", "This order is already confirmed.");
      const { failure, fields, items } = validate(await parseBody(request).catch(() => null), !confirm);
      if (failure) return failure;
      const changes = confirm ? { ...fields, state: "confirmed", confirmed_at: now, not_in_chat: [] } : fields;
      const { rows } = await db(env, user.headers, "orders", {
        method: "PATCH",
        query: { id: `eq.${id}`, owner_id: `eq.${user.id}` },
        body: { ...changes, updated_at: now },
      }, fetchImpl);
      const savedItems = items ? await replaceItems(env, user, id, items, fetchImpl) : current.items;
      if (confirm && current.upload_id) await clearUpload(env, user, current.upload_id, fetchImpl);
      return { status: 200, body: { order: toOrder(rows[0], savedItems) } };
    }

    return error(404, "NOT_FOUND", "Route not found.");
  } catch (errorCause) {
    return error(500, "INTERNAL_ERROR", errorCause?.message || "Could not process this order.");
  }
}
