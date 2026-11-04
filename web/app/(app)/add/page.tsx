"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState, type ChangeEvent } from "react";
import { AppHeader, PageTitle, StatePanel, btn } from "@/components/ui";
import { ApiError, createExtraction } from "@/lib/api";
import { shortDate } from "@/lib/format";
import type { ExtractionInput, Order } from "@/lib/types";

const MAX_FILES = 5; // [proposed] limit from design-brief §2 and the Figma "upload limits" frame
const ALLOWED_TYPES = ["image/png"]; // the extraction route reads PNG screenshots only

type View =
  | { kind: "choose" }
  | { kind: "paste" }
  | { kind: "reading" }
  | { kind: "unreadable" }
  | { kind: "no_order" }
  | { kind: "failed"; reason: string | null; input: ExtractionInput }
  | { kind: "limits" }
  | { kind: "interrupted" }
  | { kind: "several"; drafts: Order[] };

export default function AddOrderPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>({ kind: "choose" });
  const [text, setText] = useState("");

  // Cache Components keeps this page alive (hidden) after navigating away, so without this the
  // next visit would reopen on "Reading the chat…" or an old result with no way to upload again.
  useLayoutEffect(
    () => () => {
      setView({ kind: "choose" });
    },
    [],
  );

  async function read(input: ExtractionInput) {
    setView({ kind: "reading" });
    try {
      const result = await createExtraction(input);
      if (result.status === "draft_ready") {
        if (result.drafts.length === 1) router.push(`/orders/${result.drafts[0].id}`);
        else setView({ kind: "several", drafts: result.drafts });
      } else if (result.status === "failed") {
        setView({ kind: "failed", reason: result.upload.failure_reason, input });
      } else {
        setView({ kind: result.status });
      }
    } catch (err) {
      const reason = err instanceof ApiError ? err.message : "We couldn’t reach MabiList. Check your connection.";
      setView({ kind: "failed", reason, input });
    }
  }

  function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // lets the seller pick the same file again after a failure
    if (files.length === 0) return;
    if (files.length > MAX_FILES || files.some((f) => !ALLOWED_TYPES.includes(f.type))) {
      setView({ kind: "limits" });
      return;
    }
    read({ kind: "image", files });
  }

  const pickFiles = () => fileInput.current?.click();

  return (
    <>
      <AppHeader title="Add order" />
      <main className="px-4 pb-12 pt-7">
        <PageTitle eyebrow="From chat to order list">How do you want to add it?</PageTitle>
        <input
          ref={fileInput}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          multiple
          hidden
          onChange={onFiles}
        />

        {view.kind === "choose" && (
          <>
            <ul className="border-t-[1.25px] border-ink">
              <li>
                <ChoiceRow icon="/icons/upload.svg" title="Upload screenshot" note="Choose one clear conversation image" onClick={pickFiles} />
              </li>
              <li>
                <ChoiceRow icon="/icons/paste.svg" title="Paste chat text" note="Copy the customer’s messages here" onClick={() => setView({ kind: "paste" })} />
              </li>
            </ul>
          </>
        )}

        {view.kind === "paste" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) read({ kind: "text", text });
            }}
            className="grid gap-[7px]"
          >
            <label htmlFor="chat" className="font-body text-[13px] font-bold">
              Chat text
            </label>
            <textarea
              id="chat"
              rows={6}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="rounded-[10px] border-[1.25px] border-line bg-field p-3 font-body text-base outline-none focus:border-ink"
            />
            <div className="flex gap-1 pt-4">
              <button type="submit" disabled={!text.trim()} className={btn.primary}>
                Read this chat
              </button>
              <button type="button" onClick={() => setView({ kind: "choose" })} className={btn.plain}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {view.kind === "reading" && (
          <StatePanel title="Reading the chat…" body="Turning the message into an order entry.">
            <div aria-hidden className="grid w-full gap-3 pt-3">
              <div className="h-[18px] w-full animate-pulse rounded bg-skeleton" />
              <div className="h-[18px] w-[72%] animate-pulse rounded bg-skeleton" />
              <div className="h-[18px] w-[88%] animate-pulse rounded bg-skeleton" />
            </div>
          </StatePanel>
        )}

        {view.kind === "unreadable" && (
          <StatePanel title="We couldn’t read that chat" body="Try a clearer screenshot or paste the message instead.">
            <button type="button" onClick={() => setView({ kind: "choose" })} className={btn.primary}>
              Try again
            </button>
          </StatePanel>
        )}

        {view.kind === "no_order" && (
          <StatePanel
            showLogo={false}
            title="We didn’t find an order in this chat"
            body="Nothing was saved. You can enter the order yourself instead."
          >
            <Link href="/add/manual" className={btn.primary}>
              Enter order by hand
            </Link>
            <button type="button" onClick={() => setView({ kind: "choose" })} className={btn.plain}>
              Try another chat
            </button>
          </StatePanel>
        )}

        {view.kind === "failed" && (
          <StatePanel title="Reading the chat failed" body={view.reason ?? "Something went wrong while reading. Your chat is still here."}>
            <button type="button" onClick={() => read(view.input)} className={btn.primary}>
              Try again
            </button>
            <Link href="/add/manual" className={btn.plain}>
              Enter order by hand
            </Link>
          </StatePanel>
        )}

        {view.kind === "limits" && (
          <StatePanel showLogo={false} title="That upload can’t be used" body={`Choose up to ${MAX_FILES} PNG screenshots from one conversation.`}>
            <button type="button" onClick={pickFiles} className={btn.primary}>
              Choose different screenshots
            </button>
          </StatePanel>
        )}

        {view.kind === "interrupted" && (
          <StatePanel
            showLogo={false}
            title="Your chat is still being read"
            body="You can leave this screen. The draft will stay here as reading, ready, or failed when you return."
          >
            <Link href="/logbook" className={btn.primary}>
              Check status
            </Link>
          </StatePanel>
        )}

        {view.kind === "several" && (
          <section aria-live="polite">
            <h3 className="font-display text-xl">We found {view.drafts.length} separate orders</h3>
            <p className="font-body text-base">Check and confirm each one on its own.</p>
            <ul className="pt-4">
              {view.drafts.map((d, i) => (
                <li key={d.id}>
                  <Link
                    href={`/orders/${d.id}`}
                    className="grid min-h-[78px] grid-cols-[1fr_auto_22px] items-center gap-3 border-b-[1.25px] border-line py-3"
                  >
                    <span className="font-display text-base font-bold">
                      Order {i + 1} · {d.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}
                    </span>
                    <span className="text-right text-xs text-muted">
                      {d.delivery_date ? `Due ${shortDate(d.delivery_date)}` : "Delivery date not in chat"}
                    </span>
                    <Image src="/icons/chevron-right.svg" alt="" width={22} height={22} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}

function ChoiceRow({ icon, title, note, onClick }: { icon: string; title: string; note: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid min-h-[94px] w-full grid-cols-[36px_1fr_22px] items-center gap-[10px] border-b-[1.25px] border-line px-1 py-[15px] text-left"
    >
      <Image src={icon} alt="" width={22} height={22} />
      <span>
        <span className="block font-display text-base font-bold">{title}</span>
        <span className="block pt-[3px] text-[12.8px] text-muted">{note}</span>
      </span>
      <Image src="/icons/chevron-right.svg" alt="" width={22} height={22} />
    </button>
  );
}
