import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  confirmOrder,
  createExtraction as createExtractionSlow,
  createManualOrder as createManualOrderSlow,
  discardDraft,
  listOrders as listOrdersSlow,
  resetMock,
} from "./mock";

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
  resetMock();
});
afterEach(() => vi.useRealTimers());

describe("mock API", () => {
  it("marks every order as sample data (INV-009)", async () => {
    const orders = await listOrders();
    expect(orders.length).toBeGreaterThan(0);
    expect(orders.every((o) => o.is_sample)).toBe(true);
  });

  it("returns each extraction outcome the screens must handle", async () => {
    const text = { kind: "text" as const, text: "2 brownies sa Wed" };
    expect((await createExtraction(text)).status).toBe("draft_ready");
    expect((await createExtraction({ kind: "text", text: "hello po" })).status).toBe("no_order");
    expect((await createExtraction(text, "unreadable")).status).toBe("unreadable");
    const failed = await createExtraction(text, "failed");
    expect(failed.status).toBe("failed");
    expect(failed.upload.failure_reason).toBeTruthy();
    const several = await createExtraction(text, "several");
    expect(several.status === "draft_ready" && several.drafts.length).toBe(2);
  });

  it("marks fields the chat didn't state instead of guessing them (INV-003)", async () => {
    const result = await createExtraction({ kind: "text", text: "2 brownies" });
    if (result.status !== "draft_ready") throw new Error("expected a draft");
    const draft = result.drafts[0];
    expect(draft.state).toBe("draft");
    expect(draft.not_in_chat).toContain("total_php");
    expect(draft.total_php).toBeNull();
  });

  it("confirms a draft into a confirmed order", async () => {
    const result = await createExtraction({ kind: "text", text: "2 brownies" });
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
  });
});
