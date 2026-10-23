"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { AppHeader, ErrorNote, Eyebrow, btn } from "@/components/ui";
import {
  connectDemoAccount,
  disconnectDemoAccount,
  listDemoConnections,
  simulateIncomingMessage,
  type DemoConnections,
  type DemoPlatform,
} from "@/lib/api";

// Figma Settings/connectedAcc frames. Simulated for the pitch only (ADR-017): no Meta login opens,
// no Meta logos, and every state says so. Telegram is not part of the demo. Removed in TASK-030.
const ACCOUNTS: { platform: DemoPlatform; name: string; sheetTitle: string; sheetBody: string }[] = [
  {
    platform: "messenger",
    name: "Facebook Page",
    sheetTitle: "Connect Facebook Page",
    sheetBody:
      "MabiList would receive new customer messages from your Page. In this demo nothing connects to Facebook: messages are simulated.",
  },
  {
    platform: "instagram",
    name: "Instagram professional",
    sheetTitle: "Connect Instagram professional",
    sheetBody:
      "MabiList would receive new customer messages from your professional account. In this demo nothing connects to Instagram: messages are simulated.",
  },
];

export default function ConnectedAccountsPage() {
  const [connections, setConnections] = useState<DemoConnections | null>(null);
  const [sheet, setSheet] = useState<DemoPlatform | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [arrived, setArrived] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    listDemoConnections()
      .then(setConnections)
      .catch(() => setError("We couldn’t load your accounts. Try again."));
  }, []);

  const closeSheet = useCallback(() => setSheet(null), []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn’t work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const open = ACCOUNTS.find((a) => a.platform === sheet);

  return (
    <>
      <AppHeader title="Connect accounts" backHref="/settings" />
      <main className="px-4 pb-12 pt-7">
        <Eyebrow>Bring messages into one list</Eyebrow>
        <h2 className="pt-2 font-display text-[29px] leading-[30.73px] tracking-[-1.16px]">Connected accounts</h2>

        <section className="pt-1">
          <h3 className="border-b-[1.25px] border-ink pb-1 font-display text-[15px]">Personal accounts</h3>
          <p className="pt-2 font-body text-base">
            For Messenger and Instagram personal chats, upload a screenshot or paste text—no connection needed.
          </p>
          <div className="flex flex-col items-start gap-2 pt-3">
            <Link href="/add" className={`${btn.outline} gap-2`}>
              <Image src="/icons/upload.svg" alt="" width={22} height={22} />
              Upload screenshot
            </Link>
            <Link href="/add" className={`${btn.outline} gap-2`}>
              <Image src="/icons/paste.svg" alt="" width={22} height={22} />
              Paste chat text
            </Link>
          </div>
        </section>

        <section className="pt-7">
          <h3 className="border-b-[1.25px] border-ink pb-1 font-display text-[15px]">Business accounts</h3>
          <p className="mt-3 border-l-4 border-amber bg-amber-soft px-3 py-2 text-[13px]">
            <strong>Simulated for this demo.</strong> No real Facebook or Instagram account is connected, and
            incoming messages are made up by the team.
          </p>

          <div aria-live="polite" className="pt-3">
            {error && <ErrorNote>{error}</ErrorNote>}
            {arrived && (
              <p className="rounded-[10px] border-[1.25px] border-ink px-3 py-2 text-sm">
                A simulated message from {arrived.name} is now a draft.{" "}
                <Link href={`/orders/${arrived.id}`} className="font-bold underline">
                  Check it
                </Link>
              </p>
            )}
          </div>

          {!connections && !error && <div aria-label="Loading accounts" className="mt-3 h-20 animate-pulse rounded-[10px] bg-skeleton" />}

          {connections && (
            <ul>
              {ACCOUNTS.map(({ platform, name }) => {
                const on = connections[platform];
                return (
                  <li key={platform} className="border-b-[1.25px] border-line py-4">
                    <div className="flex items-center justify-between gap-3">
                      <span>
                        <span className="block font-display text-base font-bold">{name}</span>
                        <span className="block pt-1 text-[12.8px] text-muted">
                          {on ? "Connected (simulated) · New messages become drafts" : "Not connected"}
                        </span>
                      </span>
                      {on ? (
                        <button
                          type="button"
                          disabled={busy}
                          className={btn.plain}
                          onClick={() => {
                            const ok = window.confirm(
                              `Disconnect ${name}? Messages stop arriving and drafts from it are deleted. Confirmed orders stay.`,
                            );
                            if (ok) run(async () => setConnections(await disconnectDemoAccount(platform)));
                          }}
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button type="button" disabled={busy} className={btn.outline} onClick={() => setSheet(platform)}>
                          Connect
                        </button>
                      )}
                    </div>
                    {on && (
                      <button
                        type="button"
                        disabled={busy}
                        className={`${btn.link} mt-1 min-h-11 text-sm`}
                        onClick={() =>
                          run(async () => {
                            const draft = await simulateIncomingMessage(platform);
                            setArrived({ id: draft.id, name: draft.customer_name ?? "a customer" });
                          })
                        }
                      >
                        Simulate an incoming message
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {open && (
        <Sheet label={open.sheetTitle} onClose={closeSheet}>
          <p className="text-[13px] text-muted">{open.sheetTitle}</p>
          <h3 className="font-display text-xl">Only new customer messages</h3>
          <p className="pt-1 font-body text-base">{open.sheetBody}</p>
          <p className="pt-2 font-body text-base">
            Messages are deleted after you confirm or delete the draft, or after 7 days.
          </p>
          <div className="grid gap-2 pt-4">
            <button
              type="button"
              disabled={busy}
              className={`${btn.primary} w-full`}
              onClick={() =>
                run(async () => {
                  setConnections(await connectDemoAccount(open.platform));
                  setSheet(null);
                })
              }
            >
              {busy ? "Connecting…" : "Connect (simulated)"}
            </button>
            <button type="button" className={`${btn.plain} w-full`} onClick={closeSheet}>
              Not now
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
