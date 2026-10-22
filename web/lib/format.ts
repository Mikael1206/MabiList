import type { Order } from "./types";

const TZ = "Asia/Manila";

/** ₱1,250 or ₱1,250.50 — pesos, centavos only when present (BR-004). */
export function peso(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

/** Today's date as YYYY-MM-DD in Philippine time. */
export function todayManila(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

/** Whole days from `from` to `to`, both YYYY-MM-DD. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(date) + days * 86_400_000).toISOString().slice(0, 10);
}

/** "Wed 21 Oct" */
export function shortDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${date}T00:00:00Z`))
    .replace(",", "");
}

/** "Tue 20 Oct 2026" */
export function longDate(date: string): string {
  return `${shortDate(date)} ${date.slice(0, 4)}`;
}

/** "Due today", "Due Wed 21 Oct", or "Delivered Mon 19 Oct" — the logbook row wording. */
export function dueLabel(order: Order, today: string): string {
  if (!order.delivery_date) return "Delivery date not set";
  if (order.delivery_status === "delivered") return `Delivered ${shortDate(order.delivery_date)}`;
  return order.delivery_date === today ? "Due today" : `Due ${shortDate(order.delivery_date)}`;
}

export function itemsLabel(order: Order): string {
  return order.items.map((i) => `${i.name} ×${i.quantity}`).join(" · ");
}

export const SOURCE_LABEL: Record<Order["source"], string> = {
  screenshot: "From screenshot",
  paste: "From pasted chat",
  manual: "Typed by you",
  messenger: "From Messenger",
  instagram: "From Instagram",
  telegram: "From Telegram",
};

export type LogbookGroup = "Today" | "Tomorrow" | "This week" | "Later" | "No date" | "Delivered";

/** Which heading a confirmed order sits under in the logbook (Figma `Logbook/all`). */
export function groupOf(order: Order, today: string): LogbookGroup {
  if (order.delivery_status === "delivered") return "Delivered";
  if (!order.delivery_date) return "No date";
  const days = daysBetween(today, order.delivery_date);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return "This week";
  return "Later";
}

/** Days left before an unconfirmed draft's screenshot is deleted (INV-001). */
export function daysUntilExpiry(expiresAt: string, now = new Date()): number {
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - now.getTime()) / 86_400_000));
}
