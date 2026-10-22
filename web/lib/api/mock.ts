// Development stand-in for the routes in docs/sdd.md §2. Never shipped as the demo: demo data comes
// from the real backend's sample account (frontend-kickoff-plan §7.5). Every order here is
// `is_sample: true`, so the "Sample data" label shows wherever it appears (INV-009).
//
// shortcut: orders live in module memory and reset on a full reload; fine until the real routes land.

import { addDays, todayManila } from "../format";
import type {
  ExtractionInput,
  ExtractionResult,
  Order,
  OrderInput,
  Session,
  Upload,
} from "../types";

export class ApiError extends Error {}

/** True while screens run on this mock; turns on the design's "sample input states" panel. */
export const IS_MOCK = true;

/** Forces an extraction outcome; used by the "View sample input states" panel in the design. */
export type SimulatedOutcome = "unreadable" | "no_order" | "failed" | "several";

const OWNER = "mock-owner";
const SESSION_KEY = "mabilist.mock-session";
const READING_DELAY_MS = 1200;

let seq = 0;
const id = (prefix: string) => `${prefix}-${++seq}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => new Date().toISOString();

function makeOrder(input: OrderInput, extra: Partial<Order>): Order {
  const orderId = id("order");
  return {
    id: orderId,
    owner_id: OWNER,
    upload_id: null,
    source: "manual",
    state: "confirmed",
    customer_name: input.customer_name,
    total_php: input.total_php,
    delivery_date: input.delivery_date,
    payment_status: input.payment_status,
    delivery_status: "pending",
    not_in_chat: [],
    matches_order_id: null,
    is_sample: true,
    confirmed_at: nowIso(),
    created_at: nowIso(),
    updated_at: nowIso(),
    items: input.items.map((i) => ({ id: id("item"), order_id: orderId, ...i })),
    ...extra,
  };
}

function seed(): Order[] {
  const t = todayManila();
  const confirmed = (
    name: string,
    item: string,
    qty: number,
    total: number,
    inDays: number,
    paid: boolean,
    delivered = false,
  ) =>
    makeOrder(
      {
        customer_name: name,
        items: [{ name: item, quantity: qty }],
        total_php: total,
        delivery_date: addDays(t, inDays),
        payment_status: paid ? "paid" : "unpaid",
      },
      { source: "screenshot", delivery_status: delivered ? "delivered" : "pending" },
    );
  const expires = new Date(Date.now() + 5 * 86_400_000).toISOString();
  return [
    confirmed("Rico dela Cruz", "Leche flan", 1, 350, 0, false),
    confirmed("Bea Santos", "Ube pandesal box", 2, 560, 1, true),
    confirmed("Joanna Reyes", "Ube halaya jar", 3, 660, 2, true),
    confirmed("Mark Villanueva", "Brownie box", 2, 600, 3, false),
    confirmed("Paolo Garcia", "Ube pandesal box", 4, 1120, 5, false),
    confirmed("Ana Cruz", "Leche flan", 2, 700, -1, true, true),
    makeOrder(
      {
        customer_name: "Lyn Ramos",
        items: [{ name: "Brownie box", quantity: 2 }],
        total_php: null,
        delivery_date: addDays(t, 1),
        payment_status: "not_stated",
      },
      {
        source: "screenshot",
        state: "draft",
        confirmed_at: null,
        not_in_chat: ["total_php", "payment_status"],
        expires_at: expires,
      },
    ),
  ];
}

let orders: Order[] = seed();

function findOrder(orderId: string): Order {
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new ApiError("We couldn't find that order. It may have been deleted.");
  return order;
}

// --- Session (stands in for Supabase Auth email + password sign-in, F-007) ---

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Private mode or blocked storage: the session simply won't survive a reload.
  }
}

export async function getSession(): Promise<Session | null> {
  return readSession();
}

export async function signIn(email: string, password: string): Promise<Session> {
  await wait(400);
  // Mock rule so the error state can be seen: passwords shorter than 8 characters are rejected.
  if (!email.includes("@") || password.length < 8) {
    throw new ApiError("That email or password doesn’t look right. Try again.");
  }
  const session = { email, shop_name: readSession()?.shop_name ?? "Mila’s Home Bakery" };
  writeSession(session);
  return session;
}

export async function signUp(shopName: string, email: string, password: string): Promise<Session> {
  await wait(400);
  if (password.length < 8) throw new ApiError("Use at least 8 characters for your password.");
  if (email.trim().toLowerCase() === "taken@example.com") {
    throw new ApiError("An account with that email already exists. Sign in instead.");
  }
  const session = { email, shop_name: shopName };
  writeSession(session);
  return session;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await wait(300);
  void email;
}

export async function signOut(): Promise<void> {
  writeSession(null);
}

// --- Orders (sdd.md §2) ---

export async function listOrders(): Promise<Order[]> {
  await wait(250);
  return orders.filter((o) => o.state === "confirmed" || o.state === "draft");
}

export async function getOrder(orderId: string): Promise<Order> {
  await wait(150);
  return findOrder(orderId);
}

/** POST /api/orders — manual entry, saved as confirmed. */
export async function createManualOrder(input: OrderInput): Promise<Order> {
  await wait(300);
  const order = makeOrder(input, { source: "manual" });
  orders = [...orders, order];
  return order;
}

/** POST /api/orders/{id}/confirm — saves the owner's values; the raw upload is deleted. */
export async function confirmOrder(orderId: string, input: OrderInput): Promise<Order> {
  await wait(300);
  const draft = findOrder(orderId);
  const confirmed = makeOrder(input, {
    id: draft.id,
    source: draft.source,
    upload_id: null,
    not_in_chat: [],
    expires_at: null,
  });
  orders = orders.map((o) => (o.id === orderId ? confirmed : o));
  return confirmed;
}

/** PATCH /api/orders/{id} — edits a confirmed order. */
export async function updateOrder(
  orderId: string,
  patch: Partial<OrderInput> & { delivery_status?: Order["delivery_status"] },
): Promise<Order> {
  await wait(250);
  const current = findOrder(orderId);
  const updated: Order = {
    ...current,
    ...patch,
    items: patch.items
      ? patch.items.map((i) => ({ id: id("item"), order_id: orderId, ...i }))
      : current.items,
    updated_at: nowIso(),
  };
  orders = orders.map((o) => (o.id === orderId ? updated : o));
  return updated;
}

/** DELETE /api/orders/{id} — drafts only; deletes the draft and its raw upload. */
export async function discardDraft(orderId: string): Promise<void> {
  await wait(250);
  if (findOrder(orderId).state !== "draft") {
    throw new ApiError("Only drafts can be deleted.");
  }
  orders = orders.filter((o) => o.id !== orderId);
}

// --- Extraction (POST /api/extractions) ---

function makeUpload(kind: Upload["kind"], status: Upload["status"], reason: string | null = null) {
  const created = nowIso();
  return {
    id: id("upload"),
    owner_id: OWNER,
    kind,
    status,
    failure_reason: reason,
    created_at: created,
    expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  } satisfies Upload;
}

function draftFrom(upload: Upload, input: OrderInput, notInChat: Order["not_in_chat"]): Order {
  return makeOrder(input, {
    source: upload.kind === "image" ? "screenshot" : "paste",
    upload_id: upload.id,
    state: "draft",
    confirmed_at: null,
    not_in_chat: notInChat,
    expires_at: upload.expires_at,
  });
}

export async function createExtraction(
  input: ExtractionInput,
  simulate?: SimulatedOutcome,
): Promise<ExtractionResult> {
  await wait(READING_DELAY_MS);
  const kind = input.kind;

  if (simulate === "unreadable") return { status: "unreadable", upload: makeUpload(kind, "no_order") };
  if (simulate === "failed") {
    return { status: "failed", upload: makeUpload(kind, "failed", "The reading service timed out.") };
  }
  // Mock rule: pasted text with no number in it reads as small talk, not an order.
  if (simulate === "no_order" || (input.kind === "text" && !/\d/.test(input.text))) {
    return { status: "no_order", upload: makeUpload(kind, "no_order") };
  }

  const upload = makeUpload(kind, "draft_ready");
  const tomorrow = addDays(todayManila(), 1);
  const drafts = [
    draftFrom(
      upload,
      {
        customer_name: null,
        items: [{ name: "Brownie box", quantity: 2 }],
        total_php: null,
        delivery_date: tomorrow,
        payment_status: "paid",
      },
      ["customer_name", "total_php"],
    ),
  ];
  if (simulate === "several") {
    drafts.push(
      draftFrom(
        upload,
        {
          customer_name: null,
          items: [{ name: "Leche flan", quantity: 1 }],
          total_php: null,
          delivery_date: null,
          payment_status: "not_stated",
        },
        ["customer_name", "total_php", "delivery_date", "payment_status"],
      ),
    );
  }
  orders = [...orders, ...drafts];
  return { status: "draft_ready", upload, drafts };
}

/** Test hook: restores the seeded sample data. */
export function resetMock() {
  orders = seed();
}
