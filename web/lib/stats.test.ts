import { describe, expect, it } from "vitest";
import { computeStats, missingDetails, mondayOf, needsCheck } from "./stats";
import { proposedChanges } from "./updates";
import type { Order } from "./types";

const order = (patch: Partial<Order>): Order => ({
  id: "o",
  upload_id: null,
  source: "manual",
  state: "confirmed",
  customer_name: "Rico",
  total_php: 100,
  delivery_date: "2026-10-23",
  payment_status: "paid",
  delivery_status: "pending",
  not_in_chat: [],
  matches_order_id: null,
  is_sample: true,
  confirmed_at: "2026-10-22T02:00:00Z", // Thu 22 Oct, 10:00 Manila
  created_at: "",
  updated_at: "",
  items: [{ id: "i", order_id: "o", name: "Leche flan", quantity: 1, unit_price_php: null }],
  ...patch,
});

// Thursday 22 Oct 2026, 12:00 Manila.
const NOW = new Date("2026-10-22T04:00:00Z");

describe("computeStats", () => {
  it("weeks start on Monday", () => {
    expect(mondayOf("2026-10-22")).toBe("2026-10-19");
    expect(mondayOf("2026-10-19")).toBe("2026-10-19");
    expect(mondayOf("2026-10-25")).toBe("2026-10-19"); // Sunday
  });

  it("counts confirmed, priced orders by confirmation day in Manila (INV-002)", () => {
    const s = computeStats(
      [
        order({ total_php: 350 }),
        // 23:30 Manila on Mon 19 Oct = 15:30 UTC: still this week, not today.
        order({ total_php: 200, confirmed_at: "2026-10-19T15:30:00Z" }),
        order({ total_php: 999, confirmed_at: "2026-10-01T02:00:00Z" }), // this month only
        order({ total_php: null }), // no price: never counted
        order({ state: "draft", total_php: 5000, confirmed_at: null }), // draft: never counted
      ],
      NOW,
    );
    expect(s.today).toBe(350);
    expect(s.week).toBe(550);
    expect(s.month).toBe(1549);
    expect(s.week_by_day).toEqual([200, 0, 0, 350, 0, 0, 0]);
    expect(s.without_price).toBe(1);
    expect(s.needs_check).toBe(2); // the draft + the confirmed order with no price
  });

  it("adds up what is still owed and groups top items case-insensitively", () => {
    const s = computeStats(
      [
        order({ payment_status: "unpaid", total_php: 300, items: [{ id: "a", order_id: "o", name: "Ube  Jar", quantity: 2, unit_price_php: null }] }),
        order({ payment_status: "unpaid", total_php: 200, items: [{ id: "b", order_id: "o", name: "ube jar", quantity: 3, unit_price_php: null }] }),
        order({ delivery_status: "delivered" }),
      ],
      NOW,
    );
    expect(s.still_owed).toBe(500);
    expect(s.still_owed_orders).toBe(2);
    expect(s.delivered).toBe(1);
    expect(s.top_items[0]).toEqual({ name: "Ube  Jar", quantity: 5 });
  });

  it("counts deliveries due in the next 7 days, today included", () => {
    const s = computeStats(
      [
        order({ delivery_date: "2026-10-22" }),
        order({ delivery_date: "2026-10-28" }),
        order({ delivery_date: "2026-10-29" }), // day 8
        order({ delivery_date: "2026-10-23", delivery_status: "delivered" }),
      ],
      NOW,
    );
    expect(s.due_next_7_days).toBe(2);
  });
});

describe("needs your check", () => {
  it("covers drafts and confirmed orders missing a price, delivery date or payment", () => {
    expect(needsCheck(order({ state: "draft" }))).toBe(true);
    expect(needsCheck(order({}))).toBe(false); // complete confirmed order
    const carla = order({ total_php: null, delivery_date: null, payment_status: "not_stated" });
    expect(missingDetails(carla)).toEqual(["price", "delivery date", "payment"]);
    expect(needsCheck(carla)).toBe(true);
    expect(needsCheck(order({ payment_status: "unpaid" }))).toBe(false); // unpaid is stated
  });
});

describe("proposedChanges", () => {
  it("proposes only fields the chat stated (INV-003)", () => {
    const target = order({ payment_status: "unpaid", items: [{ id: "t", order_id: "o", name: "Leche flan", quantity: 3, unit_price_php: null }] });
    const draft = order({
      state: "draft",
      total_php: null,
      payment_status: "paid",
      delivery_date: null,
      not_in_chat: ["total_php", "delivery_date"],
      items: [{ id: "d", order_id: "o", name: "Leche flan", quantity: 2, unit_price_php: null }],
    });
    expect(proposedChanges(draft, target).map((c) => `${c.label}: ${c.before} → ${c.after}`)).toEqual([
      "Quantity: 3 → 2",
      "Payment: Unpaid → Paid",
    ]);
  });
});
