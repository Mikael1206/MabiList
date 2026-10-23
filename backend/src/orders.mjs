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

export async function handleOrders(request, env = process.env, fetchImpl = fetch) {
  try {
    const url = new URL(request.url, `http://${request.headers.host ?? "127.0.0.1"}`);

    if (request.method === "POST" && url.pathname === "/api/jobs/expire-uploads") {
      const secret = request.headers["x-job-secret"];
      if (secret !== env.EXPIRE_UPLOADS_SECRET) return error(401, "UNAUTHENTICATED", "Invalid job secret.");
      const { rows } = await db(env, {}, "uploads", { query: { status: "eq.expired", select: "id" } }, fetchImpl);
      return { status: 200, body: { ok: true, expired: rows.length } };
    }

    if (request.method === "DELETE" && /^\/api\/orders\/[0-9a-f-]{36}$/i.test(url.pathname)) {
      const user = await owner(request.headers.authorization, env, fetchImpl);
      if (!user) return error(401, "UNAUTHENTICATED", "Please sign in.");
      const id = url.pathname.split("/").at(-1);
      await db(env, user.headers, "orders", { method: "DELETE", query: { id: `eq.${id}`, owner_id: `eq.${user.id}` } }, fetchImpl);
      return { status: 204 };
    }

    if (request.method === "POST" && url.pathname === "/api/orders") {
      const user = await owner(request.headers.authorization, env, fetchImpl);
      if (!user) return error(401, "UNAUTHENTICATED", "Please sign in.");
      const payload = await parseBody(request);
      const orderId = randomUUID();
      const order = {
        id: orderId,
        owner_id: user.id,
        source: "manual",
        state: "confirmed",
        customer_name: String(payload.customer_name ?? "").trim() || null,
        total_php: Number(payload.total_php ?? 0),
        delivery_date: payload.delivery_date ?? null,
        payment_status: payload.payment_status ?? "not_stated",
        delivery_status: "pending",
        confirmed_at: new Date().toISOString(),
      };
      const { rows: savedOrders } = await db(env, user.headers, "orders", { method: "POST", body: order }, fetchImpl);
      const items = (payload.items ?? []).map((item) => ({
        id: randomUUID(),
        order_id: savedOrders[0].id,
        owner_id: user.id,
        name: item.name,
        quantity: Number(item.quantity),
        unit_price_php: item.unit_price_php === null ? null : Number(item.unit_price_php),
      }));
      if (items.length) {
        await db(env, user.headers, "order_items", { method: "POST", body: items }, fetchImpl);
      }
      return { status: 200, body: { order: { ...savedOrders[0], items } } };
    }

    return error(404, "NOT_FOUND", "Route not found.");
  } catch (errorCause) {
    return error(500, "INTERNAL_ERROR", errorCause?.message || "Could not process this order.");
  }
}
