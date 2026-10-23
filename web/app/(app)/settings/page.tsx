"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/components/SessionContext";
import { AppHeader, Eyebrow, btn } from "@/components/ui";
import { IS_MOCK, resetDemoData, signOut } from "@/lib/api";

// Not shown yet (no dead rows, INV-AS-005): Install MabiList, System states and Preview first-run
// have no packet yet. Connected accounts appears only in the simulated pitch demo (ADR-017).
export default function SettingsPage() {
  const session = useSession();
  const router = useRouter();

  async function onSignOut() {
    await signOut();
    router.replace("/sign-in");
  }

  async function onResetDemo() {
    if (!window.confirm("Reset demo data? Orders added or changed since the last reset are replaced by the sample orders.")) return;
    await resetDemoData();
    router.push("/logbook");
  }

  return (
    <>
      <AppHeader title="Settings" />
      <main className="px-4 pb-12 pt-7">
        <Eyebrow>{session?.shop_name}</Eyebrow>
        <h2 className="pb-6 pt-2 font-display text-[29px] leading-[30.73px] tracking-[-1.16px]">Settings</h2>

        <Group title="Your shop">
          <Row href="/settings/shop-name" icon="/icons/person.svg" title="Shop name" note={session?.shop_name ?? ""} />
          <Row href="/settings/email" icon="/icons/mail.svg" title="Account email" note={session?.email ?? ""} />
        </Group>

        <Group title="Orders and data">
          {IS_MOCK && (
            <Row href="/settings/accounts" icon="/icons/link.svg" title="Connected accounts" note="Simulated for this demo" />
          )}
          <Row href="/settings/privacy" icon="/icons/lock.svg" title="Privacy and data" note="What MabiList is designed to keep" />
          {IS_MOCK && (
            <li>
              <button type="button" onClick={onResetDemo} className={`${ROW} w-full text-left`}>
                <span aria-hidden />
                <RowText title="Reset demo data" note="Restores the sample orders" />
                <Image src="/icons/chevron-right.svg" alt="" width={22} height={22} />
              </button>
            </li>
          )}
        </Group>

        <button type="button" onClick={onSignOut} className={`${btn.outline} mt-7 min-h-12`}>
          Sign out
        </button>
      </main>
    </>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pb-7">
      <h3 className="border-b-[1.25px] border-ink pb-2 font-display text-[15px]">{title}</h3>
      <ul>{children}</ul>
    </section>
  );
}

const ROW = "grid min-h-[72px] grid-cols-[30px_1fr_22px] items-center gap-[10px] border-b-[1.25px] border-line py-[10px]";

function RowText({ title, note }: { title: string; note: string }) {
  return (
    <span className="min-w-0">
      <span className="block font-display text-base font-bold">{title}</span>
      <span className="block truncate pt-[3px] text-[12.8px] text-muted">{note}</span>
    </span>
  );
}

function Row({ href, icon, title, note }: { href: string; icon: string; title: string; note: string }) {
  return (
    <li>
      <Link href={href} className={ROW}>
        <Image src={icon} alt="" width={22} height={22} />
        <RowText title={title} note={note} />
        <Image src="/icons/chevron-right.svg" alt="" width={22} height={22} />
      </Link>
    </li>
  );
}
