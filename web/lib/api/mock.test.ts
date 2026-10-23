import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  applyUpdate,
  confirmOrder,
  deleteOrder,
  createExtraction as createExtractionSlow,
  createManualOrder as createManualOrderSlow,
  discardDraft,
  listOrders as listOrdersSlow,
  resetDemoData,
} from "./mock";
import { proposedChanges } from "../updates";

// The mock waits like a real network call; fake timers skip the waiting.
const fast =
  <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
  async (...args: A) => {
    const result = fn(...args);
    result.catch(() => {}); // the caller still sees the rejection; this stops a false "unhandled"
    await vi.runAllTimersAsync();
    return result;
  };
const createExtraction = fast(createExtractionSlow);
const createManualOrder = fast(createManualOrderSlow);
const listOrders = fast(listOrdersSlow);

beforeEach(() => {
  vi.useFakeTimers();
  void resetDemoData();
});
afterEach(() => vi.useRealTimers());

describe("mock API", () => {
  it("marks every order as sample data (INV-009)", async () => {
    const orders = await listOrders();
    expect(orders.length).toBeGreaterThan(0);
    expect(orders.every((o) => o.is_sample)).toBe(true);
  });

  it("returns each extraction outcome the screens must handle", async () => {
    const text = { kind: "text" as const, text: "Pwede po ba two boxes ng ube pandesal? 360 pesos po" };
    expect((await createExtraction(text)).status).toBe("draft_ready");
    expect((await createExtraction({ kind: "text", text: "2 brownies sa Wed" })).status).toBe("no_order");
    const otherImage = new File(["x"], "random.png", { type: "image/png" });
    expect((await createExtraction({ kind: "image", files: [otherImage] })).status).toBe("unreadable");
    expect((await createExtraction(text, "unreadable")).status).toBe("unreadable");
    const failed = await createExtraction(text, "failed");
    expect(failed.status).toBe("failed");
    expect(failed.upload.failure_reason).toBeTruthy();
    const several = await createExtraction(text, "several");
    expect(several.status === "draft_ready" && several.drafts.length).toBe(2);
  });

  it("marks fields the chat didn't state instead of guessing them (INV-003)", async () => {
    const result = await createExtraction({ kind: "text", text: "Dalawang large po sana na banana loaf" });
    if (result.status !== "draft_ready") throw new Error("expected a draft");
    const draft = result.drafts[0];
    expect(draft.state).toBe("draft");
    expect(draft.not_in_chat).toContain("total_php");
    expect(draft.total_php).toBeNull();
  });

  it("confirms a draft into a confirmed order", async () => {
    const result = await createExtraction({ kind: "text", text: "banana loaf, dalawang large" });
    if (result.status !== "draft_ready") throw new Error("expected a draft");
    const confirmed = await fast(confirmOrder)(result.drafts[0].id, {
      customer_name: "Lyn",
      items: [{ name: "Brownie box", quantity: 2 }],
      total_php: 600,
      delivery_date: "2026-10-21",
      payment_status: "paid",
    });
    expect(confirmed.state).toBe("confirmed");
    expect(confirmed.not_in_chat).toEqual([]);
  });

  it("deletes drafts but refuses to delete confirmed orders", async () => {
    const draft = (await listOrders()).find((o) => o.state === "draft")!;
    await fast(discardDraft)(draft.id);
    expect((await listOrders()).some((o) => o.id === draft.id)).toBe(false);

    const manual = await createManualOrder({
      customer_name: "Ana",
      items: [{ name: "Leche flan", quantity: 1 }],
      total_php: 350,
      delivery_date: null,
      payment_status: "unpaid",
    });
    await expect(fast(discardDraft)(manual.id)).rejects.toBeInstanceOf(ApiError);
    await fast(deleteOrder)(manual.id);
    expect((await listOrders()).some((o) => o.id === manual.id)).toBe(false);
  });

  it("applies only the approved changes and deletes the update draft (INV-006)", async () => {
    const all = await listOrders();
    const draft = all.find((o) => o.matches_order_id)!;
    const target = all.find((o) => o.id === draft.matches_order_id)!;
    const changes = proposedChanges(draft, target);
    const quantity = changes.find((c) => c.field === "quantity")!;

    const updated = await fast(applyUpdate)(draft.id, target.id, [quantity]);
    expect(updated.items[0].quantity).toBe(draft.items[0].quantity);
    expect(updated.payment_status).toBe(target.payment_status); // not approved, so unchanged
    expect(updated.changes).toHaveLength(1);
    expect((await listOrders()).some((o) => o.id === draft.id)).toBe(false);
  });
});
