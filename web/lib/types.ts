// Shapes copied from docs/sdd.md §4. Change sdd.md first, then this file (frontend-kickoff-plan §7).

export type UploadKind = "image" | "text";

export type UploadStatus =
  | "processing"
  | "draft_ready"
  | "no_order"
  | "failed"
  | "consumed"
  | "expired";

export type OrderSource = "screenshot" | "paste" | "manual" | "messenger" | "instagram" | "telegram";
export type OrderState = "draft" | "confirmed";
export type PaymentStatus = "unpaid" | "paid" | "not_stated";
export type DeliveryStatus = "pending" | "delivered";

/** BR-002 fields the AI may leave blank; listed in `not_in_chat` when the chat didn't state them. */
export type OrderField = "customer_name" | "items" | "total_php" | "delivery_date" | "payment_status";

export interface Upload {
  id: string;
  owner_id: string;
  kind: UploadKind;
  status: UploadStatus;
  failure_reason: string | null;
  created_at: string;
  expires_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  name: string;
  quantity: number;
}

export interface Order {
  id: string;
  owner_id: string;
  upload_id: string | null;
  source: OrderSource;
  state: OrderState;
  customer_name: string | null;
  /** Null when no price is known; such orders are left out of totals (INV-002). */
  total_php: number | null;
  /** ISO date (YYYY-MM-DD) in Asia/Manila. */
  delivery_date: string | null;
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  not_in_chat: OrderField[];
  matches_order_id: string | null;
  is_sample: boolean;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  /** Draft only: when its raw upload is deleted (INV-001). Taken from the upload's `expires_at`. */
  expires_at?: string | null;
  // The three fields below are [not in sdd.md] — see handoff/TASK-022.md "Spec changes".
  /** Draft only: the chat lines the draft was read from, deleted with the draft (INV-001). */
  chat_excerpt?: ChatLine[];
  /** Draft only: open orders with the same customer name when there is more than one (F-005). */
  match_candidates?: string[];
  /** Confirmed only: updates applied from later chats, newest last (F-005). */
  changes?: OrderChange[];
}

export interface ChatLine {
  from_customer: boolean;
  text: string;
  /** Exact phrases inside `text` that a field was read from. */
  highlights: string[];
}

export interface OrderChange {
  quote: string;
  field: OrderField | "quantity";
  before: string;
  after: string;
}

/** One proposed field change in an order-update draft (design-brief §2 "Quantity 5 → 3"). */
export interface ProposedChange {
  field: OrderField | "quantity";
  label: string;
  before: string;
  after: string;
}

export interface Stats {
  today: number;
  week: number;
  month: number;
  /** Mon–Sun totals for the current week, Monday first. */
  week_by_day: number[];
  still_owed: number;
  still_owed_orders: number;
  needs_check: number;
  waiting_for_payment: number;
  paid: number;
  delivered: number;
  without_price: number;
  top_items: { name: string; quantity: number }[];
  due_next_7_days: number;
}

/** Values the seller types or confirms. Same fields as a draft (design-brief §2 "Enter an order by hand"). */
export interface OrderInput {
  customer_name: string | null;
  items: { name: string; quantity: number }[];
  total_php: number | null;
  delivery_date: string | null;
  payment_status: PaymentStatus;
}

/** Result of POST /api/extractions. Response JSON not yet pinned in sdd.md §2 — agree with backend. */
export type ExtractionResult =
  | { status: "draft_ready"; upload: Upload; drafts: Order[] }
  | { status: "no_order"; upload: Upload }
  | { status: "unreadable"; upload: Upload }
  | { status: "failed"; upload: Upload };

export type ExtractionInput =
  | { kind: "text"; text: string }
  | { kind: "image"; files: File[] };

// [not in sdd.md] The sign-up and logbook designs show a shop name, but sdd.md §4 has no profile
// table. Kept in the mock until the backend decides where it lives.
export interface Session {
  email: string;
  shop_name: string;
}
