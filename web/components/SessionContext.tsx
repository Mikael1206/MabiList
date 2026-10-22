"use client";

import { createContext, useContext } from "react";
import type { Session } from "@/lib/types";

export const SessionContext = createContext<{ session: Session | null; setSession: (s: Session) => void }>({
  session: null,
  setSession: () => {},
});
export const useSession = () => useContext(SessionContext).session;
export const useSetSession = () => useContext(SessionContext).setSession;
