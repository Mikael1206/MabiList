"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/components/SessionContext";
import { AppHeader, Eyebrow, btn } from "@/components/ui";
import { signOut } from "@/lib/api";

// Not shown yet (no dead rows, INV-AS-005): Connected accounts stays hidden until F-006 works
// (design-brief §2); Install MabiList, System states and Preview first-run have no packet yet.
export default function SettingsPage() {
  const session = useSession();
  const router = useRouter();

  async function onSignOut() {
    await signOut();
    router.replace("/sign-in");
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
          <Row href="/settings/privacy" icon="/icons/lock.svg" title="Privacy and data" note="What MabiList is designed to keep" />
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

function Row({ href, icon, title, note }: { href: string; icon: string; title: string; note: string }) {
  return (
    <li>
      <Link href={href} className="grid min-h-[72px] grid-cols-[30px_1fr_22px] items-center gap-[10px] border-b-[1.25px] border-line py-[10px]">
        <Image src={icon} alt="" width={22} height={22} />
        <span className="min-w-0">
          <span className="block font-display text-base font-bold">{title}</span>
          <span className="block truncate pt-[3px] text-[12.8px] text-muted">{note}</span>
        </span>
        <Image src="/icons/chevron-right.svg" alt="" width={22} height={22} />
      </Link>
    </li>
  );
}
