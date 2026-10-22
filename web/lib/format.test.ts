import { describe, expect, it } from "vitest";
import { daysUntilExpiry, groupOf, peso, shortDate, todayManila } from "./format";
import type { Order } from "./types";

const order = (patch: Partial<Order>): Order => ({
  id: "o1",
  upload_id: null,
  source: "manual",
  state: "confirmed",
  customer_name: "Rico",
  total_php: 350,
  delivery_date: "2026-10-20",
  payment_status: "unpaid",
  delivery_status: "pending",
  not_in_chat: [],
  matches_order_id: null,
  is_sample: true,
  confirmed_at: null,
  created_at: "",
  updated_at: "",
  items: [],
  ...patch,
});

describe("format", () => {
  it("formats pesos with centavos only when present", () => {
    expect(peso(1120)).toBe("₱1,120");
    expect(peso(1250.5)).toBe("₱1,250.50");
  });

  it("uses Philippine time for today", () => {
    // 2026-10-20 17:30 UTC is already 21 Oct in Manila (UTC+8).
    expect(todayManila(new Date("2026-10-20T17:30:00Z"))).toBe("2026-10-21");
  });

  it("writes dates like the design", () => {
    expect(shortDate("2026-10-21")).toBe("Wed 21 Oct");
  });

  it("groups orders under the logbook headings", () => {
    const today = "2026-10-20";
    expect(groupOf(order({ delivery_date: "2026-10-20" }), today)).toBe("Today");
    expect(groupOf(order({ delivery_date: "2026-10-18" }), today)).toBe("Today");
    expect(groupOf(order({ delivery_date: "2026-10-21" }), today)).toBe("Tomorrow");
    expect(groupOf(order({ delivery_date: "2026-10-25" }), today)).toBe("This week");
    expect(groupOf(order({ delivery_date: "2026-11-02" }), today)).toBe("Later");
    expect(groupOf(order({ delivery_date: null }), today)).toBe("No date");
    expect(groupOf(order({ delivery_status: "delivered" }), today)).toBe("Delivered");
  });

  it("never reports negative days before a draft expires", () => {
    const now = new Date("2026-10-20T00:00:00Z");
    expect(daysUntilExpiry("2026-10-25T00:00:00Z", now)).toBe(5);
    expect(daysUntilExpiry("2026-10-19T00:00:00Z", now)).toBe(0);
  });
});
