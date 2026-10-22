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
