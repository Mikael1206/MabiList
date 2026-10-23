import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proposedChanges } from "../updates";
import { createExtraction, getOrder, listOrders, resetDemoData } from "./mock";
import { DEMO_SCRIPTS, matchScript, nextWeekday } from "./demo-scripts";

// The real screenshot files from public/demo, renamed the way a phone gallery would.
const screenshot = (file: string, type: string) =>
  new File([readFileSync(join(__dirname, "../../public/demo", file))], "IMG_20261023_0001", { type });

const settle = async <T>(p: Promise<T>) => {
  p.catch(() => {});
  await vi.runAllTimersAsync();
  return p;
};

const extract = async (file: string, type: string) => {
  const result = await settle(createExtraction({ kind: "image", files: [screenshot(file, type)] }));
  if (result.status !== "draft_ready") throw new Error(`expected a draft, got ${result.status}`);
  return result.drafts;
};

beforeEach(() => {
  vi.useFakeTimers();
  void resetDemoData();
});
afterEach(() => vi.useRealTimers());

describe("scripted demo chats (TASK-027)", () => {
  it("every script's byte size matches its screenshot in public/demo", () => {
    for (const s of DEMO_SCRIPTS) {
      for (const name of s.names) {
        const path = join(__dirname, "../../public/demo", name);
        if (existsSync(path)) expect(s.sizes).toContain(readFileSync(path).length);
      }
    }
  });

  it("scenario 1 — a complete order reads every field from the chat", async () => {
    const [draft] = await extract("chat-1-complete-order.jpg", "image/jpeg");
    expect(draft.customer_name).toBe("Angelica Reyes");
    expect(draft.items[0]).toMatchObject({ name: "Ube pandesal", quantity: 2, unit_price_php: 180 });
    expect(draft.total_php).toBe(360);
    expect(draft.payment_status).toBe("paid");
    expect(new Date(`${draft.delivery_date}T00:00:00Z`).getUTCDay()).toBe(3); // "Wednesday"
    expect(draft.not_in_chat).toEqual([]);
  });

  it("scenario 2 — a later change becomes an update to Mika's order: quantity and total only", async () => {
    const [draft] = await extract("chat-2-order-change.jpg", "image/jpeg");
    expect(draft.matches_order_id).toBeTruthy();
    const target = await settle(getOrder(draft.matches_order_id!));
    expect(proposedChanges(draft, target).map((c) => `${c.label}: ${c.before} → ${c.after}`)).toEqual([
      "Quantity: 5 → 3",
      "Total: ₱225 → ₱135",
    ]);
  });

  it("scenario 3 — missing details stay blank and marked, never guessed (INV-003)", async () => {
    const [draft] = await extract("chat-3-missing-fields.png", "image/png");
    expect(draft.items[0]).toMatchObject({ name: "Banana loaf (large)", quantity: 2, unit_price_php: null });
    expect(draft.customer_name).toBe("Carla M.");
    expect(draft.total_php).toBeNull();
    expect(draft.delivery_date).toBeNull();
    expect(draft.payment_status).toBe("not_stated");
    expect(draft.not_in_chat).toEqual(["total_php", "delivery_date", "payment_status"]);
  });

  it("pasted chats match by their content; other chats and screenshots are not read", async () => {
    expect(matchScript({ kind: "text", text: "Kuya, 3 na lang po pala. Okay po, bali 135 pesos na po total!\nensaymada" })?.id).toBe(
      "order-change",
    );
    expect(matchScript({ kind: "text", text: "hello po" })).toBeNull();
    const other = new File(["not a demo chat"], "other.jpg", { type: "image/jpeg" });
    expect((await settle(createExtraction({ kind: "image", files: [other] }))).status).toBe("unreadable");
    // Each run adds one draft and nothing else.
    const before = (await settle(listOrders())).length;
    await extract("chat-1-complete-order.jpg", "image/jpeg");
    expect((await settle(listOrders())).length).toBe(before + 1);
  });

  it("nextWeekday never returns today", () => {
    expect(nextWeekday("2026-10-28", 3)).toBe("2026-11-04"); // Wednesday → next Wednesday
    expect(nextWeekday("2026-10-23", 3)).toBe("2026-10-28"); // Friday → Wednesday
  });
});
