import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { PaymentStatus } from "@/lib/types";

const BTN_BASE =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] px-[18px] font-display text-base font-bold disabled:opacity-60";

export const btn = {
  primary: `${BTN_BASE} bg-ink text-cream`,
  /** Sign-in / sign-up submit: the only gradient in the design. */
  gradient: `${BTN_BASE} w-full bg-gradient-to-b from-ink to-ink-deep font-ui text-cream`,
  outline: `${BTN_BASE} min-h-11 border-[1.25px] border-ink text-ink`,
  plain: `${BTN_BASE} text-ink`,
  link: "font-display text-base font-bold text-ink underline",
};

export function AppHeader({ title, backHref }: { title: string; backHref?: string }) {
  return (
    <header className="flex min-h-[94px] items-end gap-[10px] border-b-[1.25px] border-line px-4 pb-3 pt-[47px]">
      {backHref ? (
        <Link href={backHref} aria-label="Back" className="-ml-[9px] grid size-11 place-items-center">
          <Image src="/icons/back.svg" alt="" width={22} height={22} />
        </Link>
      ) : (
        <Image src="/icons/logo.svg" alt="" width={34} height={34} />
      )}
      <h1 className="truncate font-display text-[17px] font-bold leading-[24.65px]">{title}</h1>
    </header>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[13px] font-bold leading-[18.85px] text-muted">{children}</p>;
}

export function PageTitle({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <div className="pb-6">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="pt-2 font-display text-[29px] leading-[30.73px] tracking-[-1.16px]">{children}</h2>
    </div>
  );
}

export function NotInChatChip() {
  return (
    <span className="inline-flex h-[25px] shrink-0 items-center gap-[5px] whitespace-nowrap rounded-full bg-rust px-2 text-xs font-bold text-cream">
      <span aria-hidden className="size-4 rounded-lg border-[1.25px] border-dashed border-cream" />
      Not in chat
    </span>
  );
}

export function PaymentChip({ status }: { status: PaymentStatus }) {
  if (status === "not_stated") return null;
  const paid = status === "paid";
  return (
    <span
      className={`inline-flex h-[25px] items-center gap-[5px] rounded-full border-[1.25px] px-2 text-xs font-bold ${
        paid ? "border-ink" : "border-amber"
      }`}
    >
      <span aria-hidden className="grid size-4 place-items-center rounded-lg border-[1.25px] border-ink leading-none">
        {paid ? "✓" : "◷"}
      </span>
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}

export function SampleBadge({ date }: { date: string }) {
  return (
    <p className="inline-block rounded-full border-[1.25px] border-line px-2 py-1 text-xs font-bold leading-[17.4px] text-muted">
      Sample data · {date}
    </p>
  );
}

type FieldProps = ComponentProps<"input"> & {
  label: string;
  notInChat?: boolean;
  trailing?: ReactNode;
};

export function Field({ label, notInChat, trailing, id, className = "", ...input }: FieldProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-[7px]">
      <div className="flex min-h-[18.85px] items-center justify-between gap-1">
        <label htmlFor={id} className="font-body text-[13px] font-bold leading-[18.85px]">
          {label}
        </label>
        {notInChat && <NotInChatChip />}
      </div>
      <div className="flex min-h-[50px] items-center rounded-[10px] border-[1.25px] border-line bg-field focus-within:border-ink">
        <input
          id={id}
          className={`min-w-0 flex-1 bg-transparent px-3 py-3 font-body text-base outline-none placeholder:text-ink/50 ${className}`}
          {...input}
        />
        {trailing}
      </div>
    </div>
  );
}

/** Centered result / waiting state used across the Add order flow (Figma AddOrder/* frames). */
export function StatePanel({
  title,
  body,
  showLogo = true,
  children,
}: {
  title: string;
  body?: string;
  showLogo?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-col items-center py-[42px] text-center" aria-live="polite">
      {showLogo && <Image src="/icons/logo.svg" alt="" width={34} height={34} />}
      <h3 className={`font-display text-xl leading-6 ${showLogo ? "pt-[18px]" : ""}`}>{title}</h3>
      {body && <p className="pt-[5px] font-body text-base leading-[23.2px]">{body}</p>}
      {children && <div className="flex w-full flex-col items-center gap-2 pt-3">{children}</div>}
    </section>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-[10px] bg-rust px-4 py-3 font-body text-base text-cream">
      {children}
    </p>
  );
}
