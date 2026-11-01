// The real adapter for the routes in docs/sdd.md §2 (TASK-030). Screens import from "@/lib/api"
// only. Sign-in talks to Supabase Auth directly; every product read and write goes to `/api`, which
// next.config.ts forwards to the backend with the owner's access token.

import { computeStats } from "../stats";
import type {
  ApiErrorCode,
  ExtractionInput,
  ExtractionResult,
  ListOrdersResponse,
  Order,
  OrderInput,
  OrderResponse,
  ProposedChange,
  Session,
  Stats,
} from "../types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: ApiErrorCode = "INTERNAL_ERROR",
    readonly status = 500,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Design-review buttons ("Preview a period with no sales") show only in `npm run dev`. */
export const SHOW_DEV_TOOLS = process.env.NODE_ENV === "development";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const TOKENS_KEY = "mabilist.auth";

interface Tokens {
  access_token: string;
  refresh_token: string;
  /** Unix seconds. */
  expires_at: number;
}

interface AuthReply extends Partial<Tokens> {
  expires_in?: number;
  user?: { user_metadata?: { shop_name?: unknown } };
}

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: "That email or password doesn’t look right. Try again.",
  invalid_grant: "That email or password doesn’t look right. Try again.",
  email_not_confirmed: "Confirm your email first: tap the link we sent, then sign in.",
  user_already_exists: "An account with that email already exists. Sign in instead.",
  email_exists: "An account with that email already exists. Sign in instead.",
  weak_password: "Use a stronger password: at least 8 characters.",
  over_email_send_rate_limit: "Too many emails were sent. Wait a minute and try again.",
};

function readTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

function writeTokens(tokens: Tokens | null) {
  try {
    if (tokens) localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(TOKENS_KEY);
  } catch {
    // Private mode or blocked storage: the session simply won't survive a reload.
  }
}

function saveTokens(reply: AuthReply) {
  writeTokens({
    access_token: reply.access_token!,
    refresh_token: reply.refresh_token!,
    expires_at: reply.expires_at ?? Math.floor(Date.now() / 1000) + (reply.expires_in ?? 3600),
  });
}

/** Supabase Auth REST call; Auth errors become ApiErrors with a message the seller can act on. */
async function auth(path: string, body?: unknown, token?: string, method = "POST"): Promise<AuthReply> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new ApiError("MabiList isn’t set up yet: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are missing.");
  }
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = data.error_code ?? data.error;
    throw new ApiError(
      AUTH_MESSAGES[code] ?? data.msg ?? data.error_description ?? "That didn’t work. Try again.",
      response.status === 422 ? "CONFLICT" : "UNAUTHENTICATED",
      response.status,
    );
  }
  return data;
}

let refreshing: Promise<string | null> | null = null;

/** A valid access token, refreshed once when it is about to expire; null when signed out. */
async function accessToken(): Promise<string | null> {
  const tokens = readTokens();
  if (!tokens) return null;
  if (tokens.expires_at * 1000 - 60_000 > Date.now()) return tokens.access_token;
  // One refresh at a time: Supabase refresh tokens are single-use.
  refreshing ??= auth("token?grant_type=refresh_token", { refresh_token: tokens.refresh_token })
    .then((reply) => {
      saveTokens(reply);
      return reply.access_token!;
    })
    .catch((err) => {
      if (err instanceof ApiError) writeTokens(null);
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  if (!token) throw new ApiError("You’re signed out. Sign in again to continue.", "UNAUTHENTICATED", 401);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (typeof init.body === "string") headers.set("content-type", "application/json");
  const response = await fetch(`/api${path}`, { ...init, headers });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data?.error;
    throw new ApiError(error?.message ?? "Something went wrong. Try again.", error?.code ?? "INTERNAL_ERROR", response.status, error?.fields);
  }
  return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

// --- Session (Supabase Auth email + password, F-007) ---

export async function getSession(): Promise<Session | null> {
  try {
    return await api<Session>("/session");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) writeTokens(null);
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<Session> {
  const reply = await auth("token?grant_type=password", { email, password });
  saveTokens(reply);
  const session = await api<Session>("/session");
  // With email confirmation on, sign-up has no session, so its shop name waits in the user's metadata.
  const pending = reply.user?.user_metadata?.shop_name;
  if (!session.shop_name && typeof pending === "string" && pending.trim()) return updateShopName(pending);
  return session;
}

export async function signUp(shopName: string, email: string, password: string): Promise<Session> {
  const reply = await auth("signup", { email, password, data: { shop_name: shopName } });
  if (!reply.access_token) {
    throw new ApiError("Almost done: tap the link we emailed you, then sign in.", "UNAUTHENTICATED", 401);
  }
  saveTokens(reply);
  return updateShopName(shopName);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await auth("recover", { email });
}

export async function signOut(): Promise<void> {
  const tokens = readTokens();
  writeTokens(null);
  if (tokens) await auth("logout", undefined, tokens.access_token).catch(() => {});
}

export async function updateShopName(shopName: string): Promise<Session> {
  return api<Session>("/session", json("PATCH", { shop_name: shopName }));
}

/** Supabase emails a confirmation link; the account email changes once it is opened. */
export async function updateEmail(email: string): Promise<Session> {
  const token = await accessToken();
  if (!token) throw new ApiError("You’re signed out. Sign in again to save changes.", "UNAUTHENTICATED", 401);
  await auth("user", { email }, token, "PUT");
  return api<Session>("/session");
}

// --- Orders (sdd.md §2) ---

export async function listOrders(): Promise<Order[]> {
  return (await api<ListOrdersResponse>("/orders")).orders;
}

export async function getOrder(orderId: string): Promise<Order> {
  return (await api<OrderResponse>(`/orders/${orderId}`)).order;
}

/** POST /api/orders — manual entry, saved as confirmed. */
export async function createManualOrder(input: OrderInput): Promise<Order> {
  return (await api<OrderResponse>("/orders", json("POST", input))).order;
}

/** POST /api/orders/{id}/confirm — saves the owner's values; the raw upload is deleted. */
export async function confirmOrder(orderId: string, input: OrderInput): Promise<Order> {
  return (await api<OrderResponse>(`/orders/${orderId}/confirm`, json("POST", input))).order;
}

/** PATCH /api/orders/{id} — edits a confirmed order. */
export async function updateOrder(
  orderId: string,
  patch: Partial<OrderInput> & { delivery_status?: Order["delivery_status"] },
): Promise<Order> {
  return (await api<OrderResponse>(`/orders/${orderId}`, json("PATCH", patch))).order;
}

/** DELETE /api/orders/{id} — a draft's raw upload is deleted with it. */
export async function deleteOrder(orderId: string): Promise<void> {
  await api<void>(`/orders/${orderId}`, { method: "DELETE" });
}

export const discardDraft = deleteOrder;

/**
 * Copies only the approved changes from an update draft onto its target, then deletes the draft and
 * its chat (F-005, INV-001, INV-006).
 */
export async function applyUpdate(draftId: string, targetId: string, approved: ProposedChange[]): Promise<Order> {
  const [draft, target] = await Promise.all([getOrder(draftId), getOrder(targetId)]);
  const fields = new Set(approved.map((change) => change.field));
  const patch: Partial<OrderInput> = {};
  if (fields.has("items") || fields.has("quantity")) {
    patch.items = target.items.map((item, i) => ({
      name: i === 0 && fields.has("items") ? draft.items[0].name : item.name,
      quantity: i === 0 && fields.has("quantity") ? draft.items[0].quantity : item.quantity,
      unit_price_php: item.unit_price_php,
    }));
  }
  if (fields.has("total_php")) patch.total_php = draft.total_php;
  if (fields.has("delivery_date")) patch.delivery_date = draft.delivery_date;
  if (fields.has("payment_status")) patch.payment_status = draft.payment_status;
  const updated = await updateOrder(targetId, patch);
  await deleteOrder(draftId);
  return updated;
}

/** The statistics function from sdd.md §4, over this owner's orders. */
export async function getStats(): Promise<Stats> {
  return computeStats(await listOrders());
}

// --- Extraction (POST /api/extractions) ---

export async function createExtraction(input: ExtractionInput): Promise<ExtractionResult> {
  if (input.kind === "text") return api<ExtractionResult>("/extractions", json("POST", input));
  const form = new FormData();
  form.set("kind", "image");
  for (const file of input.files) form.append("files", file);
  return api<ExtractionResult>("/extractions", { method: "POST", body: form });
}
