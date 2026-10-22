// Mirrors the statistics function in docs/sdd.md §4 so the mock and the real backend agree:
// confirmed orders with a price only (INV-002), dated by `confirmed_at` in Asia/Manila,
// weeks start on Monday (BR-004, ADR-007).

import { addDays, todayManila } from "./format";
import type { Order, Stats } from "./types";

const itemKey = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

/** Monday of the week containing `date` (YYYY-MM-DD). */
export function mondayOf(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(date, -((weekday + 6) % 7));
}

export function computeStats(orders: Order[], now = new Date()): Stats {
  const today = todayManila(now);
  const monday = mondayOf(today);
  const confirmed = orders.filter((o) => o.state === "confirmed");
  const priced = confirmed.filter((o) => o.total_php !== null && o.confirmed_at);

  const week_by_day = [0, 0, 0, 0, 0, 0, 0];
  let todaySum = 0;
  let weekSum = 0;
  let monthSum = 0;
  for (const o of priced) {
    const day = todayManila(new Date(o.confirmed_at!));
    const amount = o.total_php!;
    if (day === today) todaySum += amount;
    if (day.slice(0, 7) === today.slice(0, 7)) monthSum += amount;
    if (day >= monday && day <= today) {
      weekSum += amount;
      week_by_day[(new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7] += amount;
    }
  }

  const unpaidPriced = priced.filter((o) => o.payment_status === "unpaid");

  const items = new Map<string, { name: string; quantity: number }>();
  for (const o of confirmed) {
    for (const i of o.items) {
      const entry = items.get(itemKey(i.name)) ?? { name: i.name, quantity: 0 };
      entry.quantity += i.quantity;
      items.set(itemKey(i.name), entry);
    }
  }

  const lastDue = addDays(today, 6);
  return {
    today: todaySum,
    week: weekSum,
    month: monthSum,
    week_by_day,
    still_owed: unpaidPriced.reduce((sum, o) => sum + o.total_php!, 0),
    still_owed_orders: unpaidPriced.length,
    needs_check: orders.filter((o) => o.state === "draft").length,
    waiting_for_payment: confirmed.filter((o) => o.payment_status === "unpaid").length,
    paid: confirmed.filter((o) => o.payment_status === "paid").length,
    delivered: confirmed.filter((o) => o.delivery_status === "delivered").length,
    without_price: confirmed.filter((o) => o.total_php === null).length,
    top_items: [...items.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 3),
    due_next_7_days: confirmed.filter(
      (o) =>
        o.delivery_status === "pending" &&
        o.delivery_date !== null &&
        o.delivery_date >= today &&
        o.delivery_date <= lastDue,
    ).length,
  };
}
