"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatExcerpt } from "@/components/ChatExcerpt";
import { OrderForm } from "@/components/OrderForm";
import { AppHeader, ErrorNote, PageTitle, PaymentChip, btn } from "@/components/ui";
import { applyUpdate, confirmOrder, deleteOrder, discardDraft, getOrder, updateOrder } from "@/lib/api";
import { daysUntilExpiry, dueLabel, itemsLabel, peso, shortDate, todayManila } from "@/lib/format";
import type { Order } from "@/lib/types";
import { proposedChanges } from "@/lib/updates";

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
  if (order.state === "confirmed") return <OrderDetail order={order} onChange={setOrder} />;
  if (order.matches_order_id || order.match_candidates?.length) return <UpdateReview draft={order} />;
  return <CheckEntry draft={order} />;
}

function useDiscard(draft: Order) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  async function discard() {
    const ok = window.confirm("Delete this draft? The draft and its screenshot are deleted and can’t be brought back.");
    if (!ok) return;
    try {
      await discardDraft(draft.id);
      router.push("/logbook");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn’t delete. Try again.");
    }
  }
  return { discard, error };
}

function ExpiryNote({ draft }: { draft: Order }) {
  const days = draft.expires_at ? daysUntilExpiry(draft.expires_at) : null;
  if (days === null) return null;
  return (
    <p className="pt-2 text-center text-xs text-muted">
      Screenshot deleted in {days} {days === 1 ? "day" : "days"} unless you confirm.
    </p>
  );
}

function CheckEntry({ draft, title = "Check the entry" }: { draft: Order; title?: string }) {
  const router = useRouter();
  const { discard, error } = useDiscard(draft);

  return (
    <>
      <AppHeader title={title} backHref="/logbook" />
      <main className="px-4 pb-12 pt-7">
        {draft.chat_excerpt && draft.chat_excerpt.length > 0 && <ChatExcerpt lines={draft.chat_excerpt} />}
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
              <button type="button" onClick={discard} className={`${btn.plain} w-full`}>
                <Image src="/icons/trash.svg" alt="" width={22} height={22} />
                Delete
              </button>
              {error && <ErrorNote>{error}</ErrorNote>}
              <p className="text-center text-xs text-muted">The screenshot is deleted once you confirm.</p>
              <ExpiryNote draft={draft} />
            </div>
          )}
        />
      </main>
    </>
  );
}

/**
 * Order-update draft (F-005). No Figma frame exists for this review; built from the "Check the
 * entry" patterns and design-brief §2: show the matched order, approve changes one by one, save as
 * a new order instead, or delete. Needs a design pass (handoff/TASK-022.md).
 */
function UpdateReview({ draft }: { draft: Order }) {
  const router = useRouter();
  const { discard, error: discardError } = useDiscard(draft);
  const candidateIds = draft.match_candidates?.length ? draft.match_candidates : [draft.matches_order_id!];
  const [candidates, setCandidates] = useState<Order[] | null>(null);
  const [targetId, setTargetId] = useState<string | null>(candidateIds.length === 1 ? candidateIds[0] : null);
  const [asNew, setAsNew] = useState(false);
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all(candidateIds.map((cid) => getOrder(cid).catch(() => null)))
      .then((found) => setCandidates(found.filter((o): o is Order => o?.state === "confirmed")))
      .catch(() => setError("We couldn’t load the matching order. Check your connection."));
    // candidateIds comes from the draft, which doesn't change while this screen is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id]);

  if (asNew) return <CheckEntry draft={draft} title="Save as a new order" />;

  const target = candidates?.find((c) => c.id === targetId) ?? null;
  const changes = target ? proposedChanges(draft, target) : [];
  const approved = changes.filter((c) => !rejected.has(c.field));
  const name = draft.customer_name ?? "this customer";

  async function apply() {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      await applyUpdate(draft.id, target.id, approved);
      router.push(`/orders/${target.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn’t save. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <AppHeader title="Check the update" backHref="/logbook" />
      <main className="px-4 pb-12 pt-7">
        {draft.chat_excerpt && draft.chat_excerpt.length > 0 && <ChatExcerpt lines={draft.chat_excerpt} />}

        {!candidates && !error && <div aria-label="Loading" className="h-24 animate-pulse rounded-[10px] bg-skeleton" />}

        {candidates && candidates.length === 0 && (
          <div className="grid gap-3">
            <ErrorNote>The order this update was for is gone. You can save it as a new order or delete it.</ErrorNote>
            <button type="button" onClick={() => setAsNew(true)} className={btn.primary}>
              Save as a new order
            </button>
          </div>
        )}

        {candidates && candidates.length > 0 && !target && (
          <>
            <PageTitle eyebrow="Order update">Which order is this for?</PageTitle>
            <p className="pb-3 font-body text-base">
              {name} has {candidates.length} open orders. Pick the one this chat changes.
            </p>
            <ul className="border-t-[1.25px] border-ink">
              {candidates.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setTargetId(c.id)}
                    className="grid min-h-[78px] w-full grid-cols-[1fr_auto_22px] items-center gap-3 border-b-[1.25px] border-line py-3 text-left"
                  >
                    <span>
                      <span className="block font-display text-base font-bold">{itemsLabel(c)}</span>
                      <span className="block pt-[3px] text-xs text-muted">
                        {c.delivery_date ? `Due ${shortDate(c.delivery_date)}` : "No delivery date"}
                      </span>
                    </span>
                    <span className="text-base font-bold">{c.total_php !== null ? peso(c.total_php) : "No price"}</span>
                    <Image src="/icons/chevron-right.svg" alt="" width={22} height={22} />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setAsNew(true)} className={`${btn.link} mt-3 min-h-11`}>
              None of these — save as a new order
            </button>
          </>
        )}

        {target && (
          <>
            <PageTitle eyebrow="Order update">Changes for {target.customer_name ?? name}</PageTitle>
            <p className="font-body text-base">
              Matches the open order: <strong>{itemsLabel(target)}</strong>
              {target.delivery_date && ` · Due ${shortDate(target.delivery_date)}`}
            </p>
            {candidateIds.length > 1 && (
              <button type="button" onClick={() => setTargetId(null)} className={`${btn.link} min-h-11 text-sm`}>
                Pick a different order
              </button>
            )}

            {changes.length === 0 ? (
              <p className="mt-4 rounded-[10px] border-[1.25px] border-line p-3 font-body text-base">
                Nothing in this chat changes the order. You can delete this update.
              </p>
            ) : (
              <fieldset className="mt-4 border-t-[1.25px] border-ink">
                <legend className="sr-only">Changes to apply</legend>
                {changes.map((c) => (
                  <label key={c.field} className="flex min-h-[64px] items-center gap-3 border-b-[1.25px] border-line py-3">
                    <input
                      type="checkbox"
                      checked={!rejected.has(c.field)}
                      onChange={(e) =>
                        setRejected((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.delete(c.field);
                          else next.add(c.field);
                          return next;
                        })
                      }
                      className="size-5 accent-ink"
                    />
                    <span>
                      <span className="block font-display text-base font-bold">{c.label}</span>
                      <span className="block font-body text-base">
                        {c.before} → {c.after}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}

            <div aria-live="polite" className="pt-3">
              {(error || discardError) && <ErrorNote>{error ?? discardError}</ErrorNote>}
            </div>

            <div className="grid gap-[5px] pt-3">
              {changes.length > 0 && (
                <button type="button" onClick={apply} disabled={busy || approved.length === 0} className={`${btn.primary} w-full`}>
                  {busy
                    ? "Saving…"
                    : approved.length === 0
                      ? "Pick at least one change"
                      : `Apply ${approved.length} ${approved.length === 1 ? "change" : "changes"}`}
                </button>
              )}
              <button type="button" onClick={() => setAsNew(true)} className={`${btn.plain} w-full`}>
                Save as a new order instead
              </button>
              <button type="button" onClick={discard} className={`${btn.plain} w-full`}>
                <Image src="/icons/trash.svg" alt="" width={22} height={22} />
                Delete
              </button>
              <p className="text-center text-xs text-muted">Only the changes you tick are copied. The chat is deleted after.</p>
              <ExpiryNote draft={draft} />
            </div>
          </>
        )}
      </main>
    </>
  );
}

function OrderDetail({ order, onChange }: { order: Order; onChange: (o: Order) => void }) {
  const router = useRouter();
  const today = todayManila();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = order.customer_name?.split(" ")[0];

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

  async function onDelete() {
    const ok = window.confirm(
      `Delete ${first ? `${first}’s` : "this"} order? It’s removed from your logbook and totals and can’t be brought back.`,
    );
    if (!ok) return;
    try {
      await deleteOrder(order.id);
      router.push("/logbook");
    } catch {
      setError("That didn’t delete. Check your connection and try again.");
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
          {order.delivery_status === "pending" ? (
            <button type="button" onClick={markDelivered} disabled={busy} className={btn.primary}>
              {busy ? "Saving…" : "Mark delivered"}
            </button>
          ) : (
            <p className={`${btn.primary} pointer-events-none`}>Delivered</p>
          )}
          <Link href={`/orders/${order.id}/edit`} className={btn.outline}>
            Edit
          </Link>
        </div>
        <div aria-live="polite" className="pt-3">
          {error && <ErrorNote>{error}</ErrorNote>}
        </div>

        {order.changes && order.changes.length > 0 && (
          <section className="pt-6">
            <h3 className="border-b-[1.25px] border-ink pb-2 font-display text-xl">Changes from chat</h3>
            <ul>
              {order.changes.map((c, i) => (
                <li key={i} className="border-b-[1.25px] border-line py-3">
                  <p className="font-display text-base font-bold">“{c.quote}”</p>
                  <p className="font-body text-base">
                    {c.field === "quantity" ? "Quantity changed " : ""}
                    {c.before} → {c.after}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <button type="button" onClick={onDelete} className="mt-4 min-h-11 font-display text-base font-bold text-rust underline">
          Delete {first ? `${first}’s` : "this"} order
        </button>
      </main>
    </>
  );
}
