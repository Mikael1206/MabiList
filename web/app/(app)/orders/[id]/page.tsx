"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderForm } from "@/components/OrderForm";
import { AppHeader, ErrorNote, PageTitle, PaymentChip, btn } from "@/components/ui";
import { confirmOrder, discardDraft, getOrder, updateOrder } from "@/lib/api";
import { daysUntilExpiry, dueLabel, itemsLabel, peso, shortDate, todayManila } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrder(id)
      .then(setOrder)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <>
        <AppHeader title="Order" backHref="/logbook" />
        <main className="grid gap-3 px-4 pt-7">
          <ErrorNote>{error}</ErrorNote>
          <Link href="/logbook" className={btn.outline}>
            Back to logbook
          </Link>
        </main>
      </>
    );
  }
  if (!order) return <AppHeader title="Loading order…" backHref="/logbook" />;
  return order.state === "draft" ? <CheckEntry draft={order} /> : <OrderDetail order={order} onChange={setOrder} />;
}

function CheckEntry({ draft }: { draft: Order }) {
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const days = draft.expires_at ? daysUntilExpiry(draft.expires_at) : null;

  async function onDelete() {
    const ok = window.confirm("Delete this draft? The draft and its screenshot are deleted and can’t be brought back.");
    if (!ok) return;
    try {
      await discardDraft(draft.id);
      router.push("/logbook");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "That didn’t delete. Try again.");
    }
  }

  return (
    <>
      <AppHeader title="Check the entry" backHref="/logbook" />
      <main className="px-4 pb-12 pt-7">
        <PageTitle eyebrow="Draft entry">Check what we found</PageTitle>
        <OrderForm
          initial={draft}
          notInChat={draft.not_in_chat}
          showPayment
          onSubmit={async (input) => {
            await confirmOrder(draft.id, input);
            router.push("/logbook");
          }}
          actions={(busy) => (
            <div className="grid gap-[5px]">
              <button type="submit" disabled={busy} className={`${btn.primary} w-full`}>
                {busy ? "Confirming…" : "Confirm order"}
              </button>
              <button type="button" onClick={onDelete} className={`${btn.plain} w-full`}>
                <Image src="/icons/trash.svg" alt="" width={22} height={22} />
                Delete
              </button>
              {deleteError && <ErrorNote>{deleteError}</ErrorNote>}
              <p className="text-center text-xs text-muted">The screenshot is deleted once you confirm.</p>
              {days !== null && (
                <p className="pt-2 text-center text-xs text-muted">
                  Screenshot deleted in {days} {days === 1 ? "day" : "days"} unless you confirm.
                </p>
              )}
            </div>
          )}
        />
      </main>
    </>
  );
}

function OrderDetail({ order, onChange }: { order: Order; onChange: (o: Order) => void }) {
  const today = todayManila();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markDelivered() {
    setBusy(true);
    setError(null);
    try {
      onChange(await updateOrder(order.id, { delivery_status: "delivered" }));
    } catch {
      setError("That didn’t save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const delivery = order.delivery_date
    ? `${shortDate(order.delivery_date)}${order.delivery_date === today ? " · Today" : ""}`
    : "Not set";
  const payment = { paid: "Paid", unpaid: "Waiting for payment", not_stated: "Not stated" }[order.payment_status];

  return (
    <>
      <AppHeader title="Order detail" backHref="/logbook" />
      <main className="px-4 pb-12 pt-7">
        <p className="text-[13px]">{dueLabel(order, today)}</p>
        <h2 className="font-display text-[29px] leading-[30.73px] tracking-[-1.16px]">
          {order.customer_name ?? "Customer not set"}
        </h2>
        <p className="pt-5 font-display text-[44px] font-bold leading-none tracking-[-1.5px]">
          {order.total_php !== null ? peso(order.total_php) : "No price yet"}
        </p>
        <p className="pt-4">
          <PaymentChip status={order.payment_status} />
        </p>

        <dl className="mt-6 border-t-[1.25px] border-ink">
          {[
            ["What they ordered", itemsLabel(order) || "Not set"],
            ["Delivery", delivery],
            ["Payment", payment],
          ].map(([term, value]) => (
            <div key={term} className="flex items-center justify-between gap-4 border-b-[1.25px] border-line py-4">
              <dt className="font-body text-[15px]">{term}</dt>
              <dd className="text-right font-display text-[15px] font-semibold">{value}</dd>
            </div>
          ))}
        </dl>

        {order.total_php === null && (
          <p className="mt-4 rounded-lg border-[1.25px] border-rust-line p-2 text-center text-xs text-rust">
            No price yet · This order won’t be included in totals.
          </p>
        )}

        <div className="flex gap-1 pt-6">
          {order.delivery_status === "pending" && (
            <button type="button" onClick={markDelivered} disabled={busy} className={btn.primary}>
              {busy ? "Saving…" : "Mark delivered"}
            </button>
          )}
          <Link href={`/orders/${order.id}/edit`} className={btn.outline}>
            Edit
          </Link>
        </div>
        <div aria-live="polite" className="pt-3">
          {error && <ErrorNote>{error}</ErrorNote>}
        </div>
      </main>
    </>
  );
}
