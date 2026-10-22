import Image from "next/image";
import type { ReactNode } from "react";

/** Green hero + tilted cream sheet from the Figma Sign-in / Sign-up frames. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative mx-auto min-h-dvh max-w-[480px] overflow-hidden bg-cream">
      <div aria-hidden className="absolute inset-x-0 -top-[3px] h-[405px] overflow-hidden bg-ink">
        <div className="absolute left-[22%] -top-[60px] h-[330px] w-[410px] rotate-[16deg] rounded-[73px] bg-[rgb(16_93_72/0.3)]" />
        <div className="absolute -left-[400px] top-[40px] h-[306px] w-[410px] rotate-[25deg] rounded-[73px] bg-[rgb(33_76_64/0.36)]" />
        <div className="absolute left-[72%] top-[20px] h-[275px] w-[382px] rotate-[16deg] rounded-[47px] bg-[rgb(0_255_185/0.11)]" />
      </div>
      <div className="relative flex flex-col items-center pt-[108px] text-center text-cream">
        <div className="flex items-center gap-[9px]">
          <Image src="/icons/logo-hero.svg" alt="" width={58} height={58} priority />
          <p className="font-display text-[31px] font-extrabold tracking-[-1.36px]">MabiList</p>
        </div>
        <p className="pt-12 font-body text-xl font-bold leading-[23.2px]">From chat to order list.</p>
        <p className="w-[258px] pt-1 font-body text-[10px] font-semibold leading-3 text-line">
          Your practical logbook for customer orders, deliveries, and payments.
        </p>
      </div>
      <div
        aria-hidden
        className="absolute -left-[156px] top-[300px] h-[674px] w-[523px] rotate-[16.64deg] rounded-tl-[63px] bg-cream"
      />
      <div className="relative px-5 pb-10 pt-[88px]">{children}</div>
    </main>
  );
}
