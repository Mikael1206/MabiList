"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AppHeader, ErrorNote, Eyebrow, SampleBadge, btn } from "@/components/ui";
import { IS_MOCK, SHOW_DEV_TOOLS, getStats } from "@/lib/api";
import { addDays, longDate, peso, shortDate, todayManila } from "@/lib/format";
import type { Stats } from "@/lib/types";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** The Figma "noSales" frame: every money figure zero, counts kept. */
const emptyPeriod = (s: Stats): Stats => ({
  ...s,
  today: 0,
  week: 0,
  month: 0,
  week_by_day: [0, 0, 0, 0, 0, 0, 0],
  still_owed: 0,
  still_owed_orders: 0,
});

export default function TotalsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);
  const [previewEmpty, setPreviewEmpty] = useState(false);
  const today = todayManila();

  const load = useCallback(() => {
    getStats()
      .then((s) => {
        setStats(s);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const s = stats && previewEmpty ? emptyPeriod(stats) : stats;
  const maxDay = s ? Math.max(...s.week_by_day) : 0;

  return (
    <>
      <AppHeader title="Totals" />
      <main className="px-4 pb-12 pt-7">
        {IS_MOCK && <SampleBadge date={longDate(today)} />}
        <div className="pt-[14px]">
          <Eyebrow>Confirmed orders with prices</Eyebrow>
          <h2 className="pb-6 pt-2 font-display text-[29px] leading-[30.73px] tracking-[-1.16px]">Your shop at a glance</h2>
        </div>

        {failed && (
          <div className="grid gap-3">
            <ErrorNote>We couldn’t load your totals. Check your connection.</ErrorNote>
            <button type="button" onClick={load} className={btn.outline}>
              Try again
            </button>
          </div>
        )}
        {!s && !failed && <div aria-label="Loading totals" className="h-[165px] animate-pulse rounded-2xl bg-skeleton" />}

        {s && (
          <>
            <section className="rounded-2xl bg-amber p-6">
              <p className="font-body text-base">Still owed</p>
              <p className="pt-[7px] text-[56px] font-bold leading-[56px] tracking-[-3.4px]">{peso(s.still_owed)}</p>
              <p className="pt-[7px] font-body text-base">
                {s.still_owed_orders === 0
                  ? "No confirmed unpaid orders right now"
                  : `From ${s.still_owed_orders} ${s.still_owed_orders === 1 ? "order" : "orders"} waiting for payment`}
              </p>
            </section>

            <Block title="Sales">
              <Line label="Today" value={peso(s.today)} />
              <Line label="This week" value={peso(s.week)} />
              <Line label="This month" value={peso(s.month)} />
              {/* The Figma caption says "by delivery date"; ADR-007 counts sales by confirmation date. */}
              <p className="pt-[10px] text-xs text-muted">Sales are counted on the day you confirmed the order.</p>
              {maxDay > 0 ? (
                <figure className="mt-2">
                  <div
                    role="img"
                    aria-label={`Sales this week: ${s.week_by_day.map((v, i) => `${DAY_NAMES[i]} ${peso(v)}`).join(", ")}`}
                    className="relative flex h-[140px] items-end justify-around border-b-[1.25px] border-line bg-[linear-gradient(to_bottom,transparent_34px,var(--color-line)_34px,var(--color-line)_35px,transparent_35px,transparent_69px,var(--color-line)_69px,var(--color-line)_70px,transparent_70px,transparent_104px,var(--color-line)_104px,var(--color-line)_105px,transparent_105px)]"
                  >
                    {s.week_by_day.map((v, i) => (
                      <div key={i} className="w-[18px] bg-amber" style={{ height: `${(v / maxDay) * 105}px` }} />
                    ))}
                  </div>
                  <div aria-hidden className="flex justify-around pt-1 text-[11px]">
                    {DAYS.map((d, i) => (
                      <span key={i} className="w-[18px] text-center">
                        {d}
                      </span>
                    ))}
                  </div>
                </figure>
              ) : (
                <p className="mt-3 rounded-[10px] border-[1.25px] border-line p-3 font-body text-base text-muted">
                  No confirmed sales with a price this week yet.
                </p>
              )}
              {SHOW_DEV_TOOLS && (
                <button type="button" onClick={() => setPreviewEmpty((p) => !p)} className={`${btn.link} mt-2 min-h-11`}>
                  {previewEmpty ? "Show sample totals" : "Preview a period with no sales"}
                </button>
              )}
            </Block>

            <Block title="Orders by what’s next">
              <Line label="Needs your check" value={s.needs_check} />
              <Line label="Waiting for payment" value={s.waiting_for_payment} />
              <Line label="Paid" value={s.paid} />
              <Line label="Delivered" value={s.delivered} />
              {s.without_price > 0 && (
                <Link
                  href="/logbook"
                  className="mt-[10px] flex min-h-12 items-center justify-between rounded-lg border-[1.25px] border-rust-line px-3 font-display text-base text-rust"
                >
                  {s.without_price} {s.without_price === 1 ? "order has" : "orders have"} no price yet
                  <span className="font-bold">Review</span>
                </Link>
              )}
            </Block>

            <Block title="Top-selling items">
              {s.top_items.length === 0 ? (
                <p className="py-3 text-sm text-muted">No confirmed orders yet.</p>
              ) : (
                s.top_items.map((item, i) => <Line key={item.name} label={`${i + 1} · ${item.name}`} value={`${item.quantity} sold`} />)
              )}
            </Block>

            <Block title="Due in the next 7 days">
              <p className="flex items-baseline gap-2 pt-3">
                <span className="font-display text-[44px] font-bold leading-none">{s.due_next_7_days}</span>
                <span className="font-body text-base">
                  {s.due_next_7_days === 1 ? "order" : "orders"} to pack and deliver
                </span>
              </p>
              <p className="pt-1 font-body text-sm">
                {shortDate(today)}–{shortDate(addDays(today, 6))}
              </p>
            </Block>
          </>
        )}
      </main>
    </>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pt-8">
      <h3 className="border-b-[1.25px] border-ink pb-2 font-display text-[15px]">{title}</h3>
      {children}
    </section>
  );
}

function Line({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between border-b-[1.25px] border-line">
      <span className="font-body text-base">{label}</span>
      <span className="text-base font-bold">{value}</span>
    </div>
  );
}
