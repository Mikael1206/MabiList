import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A browser-like localStorage; each test reloads the mock module to stand in for a page reload.
function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

const loadMock = async () => {
  vi.resetModules();
  return import("./mock");
};

const settle = async <T>(p: Promise<T>) => {
  p.catch(() => {}); // the caller still sees a rejection; this stops a false "unhandled"
  await vi.runAllTimersAsync();
  return p;
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("demo data storage (TASK-026)", () => {
  it("keeps a new order after a reload, then reset restores the sample orders", async () => {
    vi.stubGlobal("localStorage", fakeStorage());
    const first = await loadMock();
    const seeded = await settle(first.listOrders());
    const added = await settle(
      first.createManualOrder({
        customer_name: "Demo buyer",
        items: [{ name: "Leche flan", quantity: 1 }],
        total_php: 350,
        delivery_date: null,
        payment_status: "paid",
      }),
    );

    const reloaded = await loadMock();
    const after = await settle(reloaded.listOrders());
    expect(after.some((o) => o.id === added.id)).toBe(true);

    // A new order after the reload must not reuse a saved id.
    const next = await settle(
      reloaded.createManualOrder({
        customer_name: "Second buyer",
        items: [{ name: "Brownie box", quantity: 1 }],
        total_php: 300,
        delivery_date: null,
        payment_status: "unpaid",
      }),
    );
    expect(after.some((o) => o.id === next.id)).toBe(false);

    await reloaded.resetDemoData();
    const reset = await settle((await loadMock()).listOrders());
    expect(reset).toHaveLength(seeded.length);
    expect(reset.some((o) => o.customer_name === "Demo buyer")).toBe(false);
  });

  it("falls back to the sample orders when saved data is broken or from an older shape", async () => {
    const storage = fakeStorage();
    storage.setItem("mabilist.demo-orders.v1", JSON.stringify([{ id: 1, nope: true }]));
    vi.stubGlobal("localStorage", storage);
    const orders = await settle((await loadMock()).listOrders());
    expect(orders.length).toBeGreaterThan(0);
    expect(orders.every((o) => o.is_sample)).toBe(true);
  });

  it("simulated accounts: connect, receive a draft, disconnect removes its drafts, reset disconnects", async () => {
    vi.stubGlobal("localStorage", fakeStorage());
    const mock = await loadMock();
    await expect(settle(mock.simulateIncomingMessage("messenger"))).rejects.toBeInstanceOf(mock.ApiError);

    await settle(mock.connectDemoAccount("messenger"));
    const draft = await settle(mock.simulateIncomingMessage("messenger"));
    expect(draft.state).toBe("draft");
    expect(draft.source).toBe("messenger");
    expect(draft.total_php).toBeNull(); // the message names no price (INV-003)
    expect(draft.not_in_chat).toContain("total_php");
    expect(new Date(`${draft.delivery_date}T00:00:00Z`).getUTCDay()).toBe(6); // "Saturday"

    // Connection survives a reload.
    const reloaded = await loadMock();
    expect((await settle(reloaded.listDemoConnections())).messenger).toBe(true);

    await settle(reloaded.disconnectDemoAccount("messenger"));
    expect((await settle(reloaded.listOrders())).some((o) => o.id === draft.id)).toBe(false);

    await settle(reloaded.connectDemoAccount("instagram"));
    await reloaded.resetDemoData();
    expect(await settle(reloaded.listDemoConnections())).toEqual({ messenger: false, instagram: false });
  });

  it("still works for the session when storage is blocked", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    const mock = await loadMock();
    const added = await settle(
      mock.createManualOrder({
        customer_name: "Private mode",
        items: [{ name: "Leche flan", quantity: 1 }],
        total_php: 350,
        delivery_date: null,
        payment_status: "paid",
      }),
    );
    expect((await settle(mock.listOrders())).some((o) => o.id === added.id)).toBe(true);
  });
});
