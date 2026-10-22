"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEM = "flex h-[61.75px] flex-col items-center justify-center rounded-[10px] font-display text-[11px] font-semibold";

export function BottomNav() {
  const path = usePathname();
  const onLogbook = path.startsWith("/logbook") || path.startsWith("/orders");
  const onAdd = path.startsWith("/add");
  const onTotals = path.startsWith("/totals");
  const onSettings = path.startsWith("/settings");

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 mx-auto grid h-[70px] max-w-[480px] grid-cols-4 border-t-[1.25px] border-line bg-cream px-2 pt-[7px]"
    >
      <Link href="/logbook" aria-current={onLogbook ? "page" : undefined} className={`${ITEM} ${onLogbook ? "text-ink" : "text-muted"}`}>
        <Image src={onLogbook ? "/icons/nav-logbook-active.svg" : "/icons/nav-logbook.svg"} alt="" width={22} height={22} />
        Logbook
      </Link>
      {/* Add order is the one filled tab on every screen in the design. */}
      <Link href="/add" aria-current={onAdd ? "page" : undefined} className={`${ITEM} bg-ink text-cream`}>
        <Image src="/icons/nav-add.svg" alt="" width={22} height={22} />
        Add order
      </Link>
      <Link href="/totals" aria-current={onTotals ? "page" : undefined} className={`${ITEM} ${onTotals ? "text-ink" : "text-muted"}`}>
        <Image src={onTotals ? "/icons/nav-totals-active.svg" : "/icons/nav-totals.svg"} alt="" width={22} height={22} />
        Totals
      </Link>
      <Link href="/settings" aria-current={onSettings ? "page" : undefined} className={`${ITEM} ${onSettings ? "text-ink" : "text-muted"}`}>
        <Image src={onSettings ? "/icons/nav-settings-active.svg" : "/icons/nav-settings.svg"} alt="" width={22} height={22} />
        Settings
      </Link>
    </nav>
  );
}
