// Stand-in for the routes in docs/sdd.md §2, and the pitch demo's data (ADR-017). Every order here
// is `is_sample: true`, so the "Sample data" label shows wherever it appears (INV-009). Demo-only
// code (browser storage, reset) is removed when the real routes land (TASK-030).

import { addDays, todayManila } from "../format";
import { computeStats } from "../stats";
import { matchScript, nextWeekday } from "./demo-scripts";
import type {
  ApiErrorCode,
  DraftResolution,
  ChatLine,
  ExtractionInput,
  ExtractionResult,
  FieldEvidence,
  Order,
  OrderChange,
  OrderInput,
  ResolveDraftBatchResponse,
  ProposedChange,
  Session,
  Stats,
  Upload,
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

/** True while screens run on this mock: sample-data labels, demo reset, simulated accounts. */
export const IS_MOCK = true;

/** Design-review buttons ("View sample input states", "Preview a period with no sales") show only
 * in `npm run dev`, never in the `npm run build` + `npm start` build used on stage (TASK-029). */
export const SHOW_DEV_TOOLS = process.env.NODE_ENV === "development";

/** Forces an extraction outcome; used by the "View sample input states" panel in the design. */
export type SimulatedOutcome = "unreadable" | "no_order" | "failed" | "several";

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
    items: input.items.map((i) => ({ id: id("item"), order_id: orderId, ...i, unit_price_php: i.unit_price_php ?? null })),
    ...extra,
  };
}

const daysAgoIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

function seed(): Order[] {
  const t = todayManila();
  const confirmed = (
    name: string,
    item: string,
    qty: number,
    total: number | null,
    inDays: number,
    paid: boolean,
    confirmedDaysAgo: number,
    delivered = false,
  ) =>
    makeOrder(
      {
        customer_name: name,
        items: [{ name: item, quantity: qty, unit_price_php: null }],
        total_php: total,
        delivery_date: addDays(t, inDays),
        payment_status: paid ? "paid" : "unpaid",
      },
      {
        source: "screenshot",
        delivery_status: delivered ? "delivered" : "pending",
        confirmed_at: daysAgoIso(confirmedDaysAgo),
      },
    );
  const expires = new Date(Date.now() + 5 * 86_400_000).toISOString();
  const joanna = confirmed("Joanna Reyes", "Ube halaya jar", 3, 660, 2, false, 1);
  const carlaA = confirmed("Carla Mendoza", "Leche flan", 1, 350, 3, true, 2);
  const carlaB = confirmed("Carla Mendoza", "Ube halaya jar", 1, 220, 4, false, 1);
  const draft = (input: OrderInput, extra: Partial<Order>) =>
    makeOrder(input, {
      source: "screenshot",
      state: "draft",
      confirmed_at: null,
      expires_at: expires,
      ...extra,
    });

  return [
    confirmed("Rico dela Cruz", "Leche flan", 1, 350, 0, false, 0),
    confirmed("Bea Santos", "Ube pandesal box", 2, 560, 1, true, 3),
    joanna,
    confirmed("Mark Villanueva", "Brownie box", 2, 600, 3, false, 0),
    carlaA,
    carlaB,
    confirmed("Paolo Garcia", "Ube pandesal box", 4, 1120, 5, false, 2),
    confirmed("Liza Tan", "Brownie box", 1, null, 6, false, 1),
    confirmed("Ana Cruz", "Leche flan", 2, 700, -1, true, 4, true),
    // Original order for the scripted "order changes later" chat (TASK-027): 5 × ₱45, pay on arrival.
    makeOrder(
      {
        customer_name: "Mika Santos",
        items: [{ name: "Ensaymada", quantity: 5, unit_price_php: 45 }],
        total_php: 225,
        delivery_date: nextWeekday(t, 5),
        payment_status: "unpaid",
      },
      { source: "screenshot", confirmed_at: daysAgoIso(1) },
    ),
    draft(
      {
        customer_name: "Lyn Ramos",
        items: [{ name: "Brownie box", quantity: 2, unit_price_php: null }],
        total_php: null,
        delivery_date: addDays(t, 1),
        payment_status: "not_stated",
      },
      {
        not_in_chat: ["total_php", "payment_status"],
        chat_excerpt: [
          { from_customer: true, text: "Hi! Lyn here, pwede 2 brownie box bukas?", highlights: ["Lyn", "2 brownie box", "bukas"] },
        ],
      },
    ),
    draft(
      {
        customer_name: "Joanna Reyes",
        items: [{ name: "Ube halaya jar", quantity: 2 }],
        total_php: null,
        delivery_date: null,
        payment_status: "paid",
      },
      {
        matches_order_id: joanna.id,
        not_in_chat: ["total_php", "delivery_date"],
        chat_excerpt: [
          { from_customer: true, text: "Make it 2 jars na lang po", highlights: ["2 jars"] },
          { from_customer: true, text: "Paid na po, sent via GCash", highlights: ["Paid na po"] },
        ],
      },
    ),
    draft(
      {
        customer_name: "Carla Mendoza",
        items: [{ name: "Ube halaya jar", quantity: 2 }],
        total_php: null,
        delivery_date: null,
        payment_status: "not_stated",
      },
      {
        match_candidates: [carlaA.id, carlaB.id],
        not_in_chat: ["total_php", "delivery_date", "payment_status"],
        chat_excerpt: [
          { from_customer: true, text: "Gawin na lang pong 2 yung ube halaya", highlights: ["2", "ube halaya"] },
        ],
      },
    ),
  ];
}

const ORDERS_KEY = "mabilist.demo-orders.v1";

const isOrderList = (value: unknown): value is Order[] =>
  Array.isArray(value) &&
  value.every((o) => o && typeof o.id === "string" && typeof o.state === "string" && Array.isArray(o.items));

/** Saved demo orders, or the seed when storage is blocked, empty, or holds an older shape. */
function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const saved: unknown = raw ? JSON.parse(raw) : null;
    if (isOrderList(saved)) {
      // Continue the id counter past saved ids so new orders never collide with them.
      for (const o of saved) {
        for (const ref of [o.id, ...o.items.map((i) => i.id)]) {
          seq = Math.max(seq, Number(ref.split("-").pop()) || 0);
        }
      }
      return saved;
    }
  } catch {
    // Storage blocked or broken JSON: fall through to the seed.
  }
  return seed();
}

function setOrders(next: Order[]) {
  orders = next;
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // Private mode or blocked storage: changes last for this session only.
  }
}

let orders: Order[] = loadOrders();

function findOrder(orderId: string): Order {
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new ApiError("We couldn't find that order. It may have been deleted.", "NOT_FOUND", 404);
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
    throw new ApiError("That email or password doesn’t look right. Try again.", "UNAUTHENTICATED", 401);
  }
  const session = { email, shop_name: readSession()?.shop_name ?? "Mila’s Home Bakery" };
  writeSession(session);
  return session;
}

export async function signUp(shopName: string, email: string, password: string): Promise<Session> {
  await wait(400);
  if (password.length < 8) throw new ApiError("Use at least 8 characters for your password.", "VALIDATION_ERROR", 400, { password: "Use at least 8 characters." });
  if (email.trim().toLowerCase() === "taken@example.com") {
    throw new ApiError("An account with that email already exists. Sign in instead.", "CONFLICT", 409, { email: "An account with that email already exists." });
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
  setOrders([...orders, order]);
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
  setOrders(orders.map((o) => (o.id === orderId ? confirmed : o)));
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
      ? patch.items.map((i) => ({ id: id("item"), order_id: orderId, ...i, unit_price_php: i.unit_price_php ?? null }))
      : current.items,
    updated_at: nowIso(),
  };
  setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
  return updated;
}

/** DELETE /api/orders/{id} — drafts only; deletes the draft and its raw upload. */
export async function discardDraft(orderId: string): Promise<void> {
  await wait(250);
  if (findOrder(orderId).state !== "draft") {
    throw new ApiError("Only drafts can be deleted.", "CONFLICT", 409);
  }
  setOrders(orders.filter((o) => o.id !== orderId));
}

/** Resolves every draft tied to one source before that source can be removed. */
export async function resolveDraftBatch(
  uploadId: string,
  resolutions: DraftResolution[],
): Promise<ResolveDraftBatchResponse> {
  await wait(300);
  const drafts = orders.filter((order) => order.upload_id === uploadId && order.state === "draft");
  const requestedIds = resolutions.map((resolution) => resolution.order_id).sort();
  const draftIds = drafts.map((draft) => draft.id).sort();
  if (!drafts.length || requestedIds.length !== draftIds.length || requestedIds.some((id, i) => id !== draftIds[i])) {
    throw new ApiError("Review every draft from this source before resolving it.", "CONFLICT", 409);
  }

  const confirmed_orders = resolutions.flatMap((resolution) => {
    if (resolution.action !== "confirm") return [];
    const draft = drafts.find((order) => order.id === resolution.order_id)!;
    return [makeOrder(resolution.values, {
      id: draft.id,
      source: draft.source,
      upload_id: null,
      not_in_chat: [],
      expires_at: null,
    })];
  });
  const discarded_order_ids = resolutions
    .filter((resolution) => resolution.action === "discard")
    .map((resolution) => resolution.order_id);
  const resolvedIds = new Set(requestedIds);
  setOrders([...orders.filter((order) => !resolvedIds.has(order.id)), ...confirmed_orders]);
  return { confirmed_orders, discarded_order_ids };
}

// --- Extraction (POST /api/extractions) ---

function makeUpload(kind: Upload["kind"], status: Upload["status"], reason: string | null = null) {
  const created = nowIso();
  return {
    id: id("upload"),
    kind,
    status,
    failure_reason: reason,
    created_at: created,
    expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  } satisfies Upload;
}

const SAMPLE_CHAT: ChatLine[] = [
  { from_customer: true, text: "Pwede po ba 2 brownies, sa Wed po sana. Magkano po?", highlights: ["2 brownies", "sa Wed po sana"] },
  { from_customer: true, text: "Paid na po, send ko na GCash", highlights: ["Paid na po"] },
];

/** Mock reading: highlights "number + word" phrases, the way a quantity is usually written. */
function excerptOf(input: ExtractionInput): ChatLine[] {
  if (input.kind === "image") return SAMPLE_CHAT;
  return input.text
    .split(/\n+/)
    .filter((line) => line.trim())
    .map((text) => ({ from_customer: true, text, highlights: text.match(/\d+\s+\p{L}+/gu) ?? [] }));
}

function draftFrom(
  upload: Upload,
  input: OrderInput,
  notInChat: Order["not_in_chat"],
  excerpt: ChatLine[],
): Order {
  return makeOrder(input, {
    chat_excerpt: excerpt,
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
  if (simulate === "no_order") return { status: "no_order", upload: makeUpload(kind, "no_order") };

  const upload = makeUpload(kind, "draft_ready");
  let drafts: Order[];
  if (simulate === "several") {
    // Design-review sample only (dev builds): two drafts from one chat.
    drafts = [
      draftFrom(
        upload,
        {
          customer_name: null,
          items: [{ name: "Brownie box", quantity: 2, unit_price_php: null }],
          total_php: null,
          delivery_date: addDays(todayManila(), 1),
          payment_status: "not_stated",
        },
        ["customer_name", "total_php"],
        excerptOf(input),
      ),
      draftFrom(
        upload,
        {
          customer_name: null,
          items: [{ name: "Leche flan", quantity: 1, unit_price_php: null }],
          total_php: null,
          delivery_date: null,
          payment_status: "not_stated",
        },
        ["customer_name", "total_php", "delivery_date", "payment_status"],
        excerptOf(input),
      ),
    ];
  } else {
    // Pitch demo (ADR-017): only the team's scripted chats are "read". Anything else gets the
    // honest result: a screenshot can't be read, pasted text has no order.
    const script = matchScript(input);
    if (!script) {
      return input.kind === "image"
        ? { status: "unreadable", upload: makeUpload(kind, "no_order") }
        : { status: "no_order", upload: makeUpload(kind, "no_order") };
    }
    const draft = draftFrom(upload, script.draft(todayManila()), script.notInChat, script.excerpt);
    if (script.updates) {
      const target = orders.find((o) => o.state === "confirmed" && o.customer_name === draft.customer_name);
      if (target) draft.matches_order_id = target.id;
    }
    drafts = [draft];
  }
  setOrders([...orders, ...drafts]);
  const field_evidence: FieldEvidence[] = [];
  const source_preview = input.kind === "text"
    ? { upload_id: upload.id, kind: "text" as const, text: input.text, expires_at: upload.expires_at }
    : { upload_id: upload.id, kind: "image" as const, preview_path: `/api/uploads/${upload.id}/source`, expires_at: upload.expires_at };
  return { status: "draft_ready", upload, drafts, source_preview, field_evidence };
}

// --- TASK-022 additions. Each one is [not in sdd.md] or extends it; see handoff/TASK-022.md. ---

/** DELETE /api/orders/{id}, extended to confirmed orders (sdd.md §2 allows drafts only). */
export async function deleteOrder(orderId: string): Promise<void> {
  await wait(250);
  findOrder(orderId);
  setOrders(orders.filter((o) => o.id !== orderId));
}

/**
 * POST /api/orders/{draftId}/apply-to/{targetId}: copies only the approved changes onto the target,
 * records them under "Changes from chat", then deletes the draft and its chat (INV-001, INV-006).
 */
export async function applyUpdate(draftId: string, targetId: string, approved: ProposedChange[]): Promise<Order> {
  await wait(300);
  const draft = findOrder(draftId);
  const target = findOrder(targetId);
  if (draft.state !== "draft" || target.state !== "confirmed") {
    throw new ApiError("That update can’t be applied any more. Check the logbook.");
  }
  const lines = draft.chat_excerpt ?? [];
  const quote =
    lines.find((l) => l.from_customer && l.highlights.length)?.text ??
    lines.find((l) => l.from_customer)?.text ??
    "From chat";
  const next: Order = { ...target, items: target.items.map((i) => ({ ...i })), updated_at: nowIso() };
  for (const change of approved) {
    if (change.field === "quantity" && next.items[0]) next.items[0].quantity = draft.items[0].quantity;
    if (change.field === "items" && next.items[0]) next.items[0].name = draft.items[0].name;
    if (change.field === "total_php") next.total_php = draft.total_php;
    if (change.field === "delivery_date") next.delivery_date = draft.delivery_date;
    if (change.field === "payment_status") next.payment_status = draft.payment_status;
  }
  const log: OrderChange[] = approved.map((c) => ({ quote, field: c.field, before: c.before, after: c.after }));
  next.changes = [...(target.changes ?? []), ...log];
  setOrders(orders.filter((o) => o.id !== draftId).map((o) => (o.id === targetId ? next : o)));
  return next;
}

/** The statistics function from sdd.md §4. */
export async function getStats(): Promise<Stats> {
  await wait(250);
  return computeStats(orders);
}

export async function updateShopName(shopName: string): Promise<Session> {
  await wait(250);
  const current = readSession();
  if (!current) throw new ApiError("You’re signed out. Sign in again to save changes.");
  const next = { ...current, shop_name: shopName };
  writeSession(next);
  return next;
}

export async function updateEmail(email: string): Promise<Session> {
  await wait(250);
  const current = readSession();
  if (!current) throw new ApiError("You’re signed out. Sign in again to save changes.");
  if (!email.includes("@")) throw new ApiError("That email doesn’t look right. Check it and try again.");
  const next = { ...current, email };
  writeSession(next);
  return next;
}

// --- Simulated connected accounts (ADR-017, TASK-028). Demo only: no Meta login or webhook. ---

export type DemoPlatform = "messenger" | "instagram";
export type DemoConnections = Record<DemoPlatform, boolean>;

const CONNECTIONS_KEY = "mabilist.demo-connections.v1";
const NO_CONNECTIONS: DemoConnections = { messenger: false, instagram: false };

function readConnections(): DemoConnections {
  try {
    const saved = JSON.parse(localStorage.getItem(CONNECTIONS_KEY) ?? "null");
    if (saved && typeof saved.messenger === "boolean" && typeof saved.instagram === "boolean") return saved;
  } catch {
    // Storage blocked or broken JSON: start disconnected.
  }
  return { ...NO_CONNECTIONS };
}

let connections = readConnections();

function setConnections(next: DemoConnections) {
  connections = next;
  try {
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
  } catch {
    // Private mode: lasts for this session only.
  }
}

export async function listDemoConnections(): Promise<DemoConnections> {
  await wait(150);
  return { ...connections };
}

export async function connectDemoAccount(platform: DemoPlatform): Promise<DemoConnections> {
  await wait(600);
  setConnections({ ...connections, [platform]: true });
  return { ...connections };
}

/** Messages stop; drafts from that account are deleted; confirmed orders stay (design-brief §2). */
export async function disconnectDemoAccount(platform: DemoPlatform): Promise<DemoConnections> {
  await wait(300);
  setConnections({ ...connections, [platform]: false });
  setOrders(orders.filter((o) => !(o.state === "draft" && o.source === platform)));
  return { ...connections };
}

/** "Simulate an incoming message": a customer message on the connected account becomes a draft. */
export async function simulateIncomingMessage(platform: DemoPlatform): Promise<Order> {
  await wait(400);
  if (!connections[platform]) {
    throw new ApiError("Connect the account first.", "CONFLICT", 409);
  }
  const upload = makeUpload("text", "draft_ready");
  // The chat says "Saturday", so the draft uses the next Saturday and nothing the chat didn't say.
  const draft = makeOrder(
    {
      customer_name: "Bea Santos",
      items: [{ name: "Ube pandesal box", quantity: 2, unit_price_php: null }],
      total_php: null,
      delivery_date: nextWeekday(todayManila(), 6),
      payment_status: "not_stated",
    },
    {
      source: platform,
      upload_id: upload.id,
      state: "draft",
      confirmed_at: null,
      not_in_chat: ["total_php", "payment_status"],
      expires_at: upload.expires_at,
      chat_excerpt: [
        {
          from_customer: true,
          text: "Hi! Bea po. Pa-order 2 ube pandesal box, pick up sa Saturday.",
          highlights: ["Bea", "2 ube pandesal box", "Saturday"],
        },
      ],
    },
  );
  setOrders([...orders, draft]);
  return draft;
}

/** Settings → "Reset demo data": restores the sample orders and disconnects demo accounts (TASK-026). */
export async function resetDemoData(): Promise<void> {
  setOrders(seed());
  setConnections({ ...NO_CONNECTIONS });
}
