"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useSession } from "@/components/SessionContext";
import { ErrorNote, Eyebrow, PaymentChip, SampleBadge, btn } from "@/components/ui";
import { listOrders } from "@/lib/api";
import {
  SOURCE_LABEL,
  daysUntilExpiry,
  dueLabel,
  groupOf,
  itemsLabel,
  longDate,
  peso,
  todayManila,
  type LogbookGroup,
} from "@/lib/format";
import { missingDetails } from "@/lib/stats";
import type { Order } from "@/lib/types";

type Filter = "all" | "unpaid" | "needs" | "delivered";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unpaid", label: "Waiting for payment" },
  { id: "needs", label: "Needs your check" },
  { id: "delivered", label: "Delivered" },
];

const GROUP_ORDER: LogbookGroup[] = ["Today", "Tomorrow", "This week", "Later", "No date", "Delivered"];

export default function LogbookPage() {
  const session = useSession();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  // Cache Components keeps this page alive (hidden) while an order is open. Back on the logbook,
  // start from "All" so a just-confirmed order shows in its category instead of under a stale filter.
  useLayoutEffect(() => () => setFilter("all"), []);
  const today = todayManila();

  const load = useCallback(() => {
    listOrders()
      .then((o) => {
        setOrders(o);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const drafts = useMemo(() => (orders ?? []).filter((o) => o.state === "draft"), [orders]);
  const confirmed = useMemo(
    () =>
      (orders ?? [])
        .filter((o) => o.state === "confirmed")
        .sort((a, b) => (a.delivery_date ?? "9999").localeCompare(b.delivery_date ?? "9999")),
    [orders],
  );

  const shown = confirmed.filter((o) => {
    if (filter === "unpaid") return o.payment_status === "unpaid" && o.delivery_status === "pending";
    if (filter === "delivered") return o.delivery_status === "delivered";
    if (filter === "needs") return false;
    return true;
  });
  // Drafts sit above the chips in "All" (Figma Logbook/all). With "Needs your check" selected they
  // list under the chips like every other filter's results (Yancy, 2026-10-22; Figma keeps them above).
  const draftsAbove = filter === "all";
  // Confirmed orders still missing a price, date or payment also need the seller (2026-10-23).
  const incomplete = confirmed.filter((o) => missingDetails(o).length > 0);
  const attention = confirmed.find(
    (o) =>
      o.payment_status === "unpaid" &&
      o.delivery_status === "pending" &&
      o.delivery_date !== null &&
      o.delivery_date <= today,
  );

  return (
    <>
      <header className="flex min-h-[94px] items-end gap-[10px] border-b-[1.25px] border-line px-4 pb-3 pt-[47px]">
        <Image src="/icons/logo-header-lg.svg" alt="" width={42} height={42} className="-mb-1" />
        <h1 className="truncate font-display text-xl font-bold">{session?.shop_name}</h1>
      </header>

      <main className="px-4 pb-12 pt-7">
        {orders?.some((o) => o.is_sample) && <SampleBadge date={longDate(today)} />}
        <div className="pt-[14px]">
          <Eyebrow>Today’s logbook</Eyebrow>
          <h2 className="pb-6 pt-2 font-display text-[25px] font-semibold leading-[30.73px] tracking-[-1.16px]">
            What needs attention
          </h2>
        </div>

        {failed && (
          <div className="grid gap-3">
            <ErrorNote>We couldn’t load your orders. Check your connection.</ErrorNote>
            <button type="button" onClick={load} className={btn.outline}>
              Try again
            </button>
          </div>
        )}

        {!orders && !failed && <LoadingRows />}

        {orders && orders.length === 0 && (
          <section className="border-y-[1.25px] border-ink py-6">
            <p className="font-display text-base font-bold">No orders yet.</p>
            <p className="pb-4 pt-1 text-sm text-muted">Add your first one from a chat screenshot.</p>
            <Link href="/add" className={btn.primary}>
              Add from chat
            </Link>
          </section>
        )}

        {orders && orders.length > 0 && (
          <>
            {attention && (
              <section className="flex items-center justify-between gap-3 border-y-[1.25px] border-ink py-[15px]">
                <div>
                  <p className="font-display text-base font-bold leading-[23.2px]">
                    {attentionLine(attention, today)}
                  </p>
                  <p className="pt-[3px] text-[12.8px] text-muted">One collection before delivery.</p>
                </div>
                <Link href={`/orders/${attention.id}`} className={`${btn.outline} shrink-0`}>
                  View {firstName(attention)}
                </Link>
              </section>
            )}

            {drafts.length > 0 && (
              <button
                type="button"
                onClick={() => setFilter("needs")}
                className="mt-5 flex w-full items-center justify-between rounded-[10px] bg-rust px-4 py-[14px] text-left text-cream"
              >
                <span>
                  <span className="block font-display text-base font-bold">
                    {drafts.length} {drafts.length === 1 ? "entry needs" : "entries need"} your check
                  </span>
                  <span className="block text-xs">Drafts stay out of the logbook until you confirm</span>
                </span>
                <Image src="/icons/chevron-right-light.svg" alt="" width={22} height={22} />
              </button>
            )}

            {draftsAbove && drafts.length > 0 && (
              <ul className="mt-3 border-t-[1.25px] border-line">
                {drafts.map((d) => (
                  <li key={d.id}>
                    <DraftRow draft={d} />
                  </li>
                ))}
              </ul>
            )}

            <div role="group" aria-label="Filter orders" className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-3">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`min-h-[42px] shrink-0 rounded-full border-[1.25px] px-[14px] font-display text-[13px] font-semibold ${
                    filter === f.id ? "border-amber bg-amber" : "border-line"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filter === "needs" && drafts.length + incomplete.length > 0 && (
              <section className="pt-5">
                <h3 className="border-b-[1.25px] border-ink pb-2 font-display text-[15px]">Needs your check</h3>
                <ul>
                  {drafts.map((d) => (
                    <li key={d.id}>
                      <DraftRow draft={d} />
                    </li>
                  ))}
                  {incomplete.map((o) => (
                    <li key={o.id}>
                      <OrderRow order={o} today={today} missing={missingDetails(o)} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {filter !== "needs" && shown.length > 0 && (
              <div className="grid gap-5 pt-5">
                {GROUP_ORDER.map((g) => {
                  const rows = shown.filter((o) => groupOf(o, today) === g);
                  if (rows.length === 0) return null;
                  return (
                    <section key={g}>
                      <h3 className="border-b-[1.25px] border-ink pb-2 font-display text-[15px]">{g}</h3>
                      <ul>
                        {rows.map((o) => (
                          <li key={o.id}>
                            <OrderRow order={o} today={today} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}

            {((filter === "needs" && drafts.length + incomplete.length === 0) || (filter !== "needs" && shown.length === 0)) && (
              <section className="pt-6 text-center">
                <p className="font-display text-base font-bold">No orders match</p>
                <button type="button" onClick={() => setFilter("all")} className={`${btn.link} mt-2 min-h-11`}>
                  Show all orders
                </button>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

function firstName(o: Order) {
  return o.customer_name?.split(" ")[0] ?? "order";
}

function attentionLine(o: Order, today: string) {
  const what = [o.total_php !== null ? peso(o.total_php) : null, o.items[0]?.name.toLowerCase()]
    .filter(Boolean)
    .join(" ");
  const when = o.delivery_date === today ? "due today" : "overdue";
  return `${firstName(o)}’s ${what} is ${when} and unpaid.`;
}

function OrderRow({ order, today, missing }: { order: Order; today: string; missing?: string[] }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="grid min-h-[78px] grid-cols-[1fr_auto] gap-[10px] border-b-[1.25px] border-line py-3"
    >
      <span className="min-w-0">
        <span className="block font-display text-base font-bold">{order.customer_name ?? "Customer not set"}</span>
        <span className="block truncate pt-[3px] text-xs text-muted">
          {[itemsLabel(order), dueLabel(order, today), SOURCE_LABEL[order.source]].filter(Boolean).join(" · ")}
        </span>
        {missing && missing.length > 0 && (
          <span className="block pt-[3px] text-xs text-rust">Missing: {missing.join(", ")}</span>
        )}
      </span>
      <span className="flex flex-col items-end">
        <span className="text-base font-bold">{order.total_php !== null ? peso(order.total_php) : "No price"}</span>
        <span className="pt-[5px]">
          <PaymentChip status={order.payment_status} />
        </span>
      </span>
    </Link>
  );
}

function DraftRow({ draft }: { draft: Order }) {
  const isUpdate = Boolean(draft.matches_order_id || draft.match_candidates?.length);
  const name = draft.customer_name ?? "Name not in chat";
  const title = isUpdate ? `${name} · Order update` : [name, itemsLabel(draft)].filter(Boolean).join(" · ");
  const days = draft.expires_at ? daysUntilExpiry(draft.expires_at) : null;
  return (
    <Link
      href={`/orders/${draft.id}`}
      className={`grid min-h-[82px] grid-cols-[1fr_22px] items-center gap-[10px] border-b-[1.25px] border-line px-1 py-3 ${
        isUpdate ? "bg-amber-soft" : ""
      }`}
    >
      <span className="min-w-0">
        <span className="block truncate font-display text-base font-bold">{title}</span>
        <span className="block pt-[2px] text-[12.8px] text-muted">
          {isUpdate
            ? `${SOURCE_LABEL[draft.source]} · ${name}`
            : draft.not_in_chat.includes("total_php")
              ? "Price not in chat"
              : SOURCE_LABEL[draft.source]}
        </span>
        {days !== null && (
          <span className="block pt-[5px] text-xs text-muted">
            Screenshot deleted in {days} {days === 1 ? "day" : "days"} unless you confirm.
          </span>
        )}
      </span>
      <Image src="/icons/chevron-right.svg" alt="" width={22} height={22} />
    </Link>
  );
}

function LoadingRows() {
  return (
    <div aria-label="Loading orders" className="grid gap-3 py-6">
      {[100, 72, 88].map((w) => (
        <div key={w} className="h-[18px] rounded bg-skeleton" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}
