// Frontend API shapes from docs/sdd.md §2 and §4. Database owner IDs stay server-side.

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
export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

/** BR-002 fields the AI may leave blank; listed in `not_in_chat` when the chat didn't state them. */
export type OrderField = "customer_name" | "items" | "total_php" | "delivery_date" | "payment_status";

export interface Upload {
  id: string;
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
  unit_price_php: number | null;
}

export interface Order {
  id: string;
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
  items: { name: string; quantity: number; unit_price_php?: number | null }[];
  total_php: number | null;
  delivery_date: string | null;
  payment_status: PaymentStatus;
}

export interface OrderResponse {
  order: Order;
}

export interface ListOrdersResponse {
  orders: Order[];
}

export type DraftResolution =
  | { order_id: string; action: "confirm"; values: OrderInput }
  | { order_id: string; action: "discard" };

export interface ResolveDraftBatchRequest {
  resolutions: DraftResolution[];
}

export interface ResolveDraftBatchResponse {
  confirmed_orders: Order[];
  discarded_order_ids: string[];
}

export type SourcePreview =
  | { upload_id: string; kind: "text"; text: string; expires_at: string }
  | { upload_id: string; kind: "image"; preview_path: string; expires_at: string };

export type FieldEvidence =
  | { order_id: string; field: OrderField; kind: "text"; start: number; end: number; quote: string }
  | { order_id: string; field: OrderField; kind: "image"; x: number; y: number; width: number; height: number };

/** JSON response from POST /api/extractions and POST /api/extractions/{id}/retry. */
export type ExtractionResult =
  | { status: "draft_ready"; upload: Upload; drafts: Order[]; source_preview: SourcePreview; field_evidence: FieldEvidence[] }
  | { status: "no_order"; upload: Upload }
  | { status: "unreadable"; upload: Upload }
  | { status: "failed"; upload: Upload };

export type ExtractionInput =
  | { kind: "text"; text: string }
  | { kind: "image"; files: File[] };

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  fields?: Record<string, string>;
}

export interface Session {
  email: string;
  /** Read from the owner's `profiles` row. */
  shop_name: string;
}
