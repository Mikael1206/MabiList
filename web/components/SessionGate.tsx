"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { SessionContext } from "./SessionContext";
import { getSession } from "@/lib/api";
import type { Session } from "@/lib/types";

/** Nothing from a logbook renders until a session exists (design-brief §2 "Signed out"). */
export function SessionGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    getSession().then((s) => {
      if (s) setSession(s);
      else router.replace("/sign-in");
    });
  }, [router]);

  if (!session) return null;

  return (
    <SessionContext.Provider value={session}>
      <div className="mx-auto min-h-dvh max-w-[480px] pb-[94px]">{children}</div>
      <BottomNav />
    </SessionContext.Provider>
  );
}
