import { SessionGate } from "@/components/SessionGate";

// The mock session lives in the browser, so these screens can't prerender. Revisit when Supabase
// Auth moves the session check to the server (TASK-002).
export const instant = false;

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <SessionGate>{children}</SessionGate>;
}
