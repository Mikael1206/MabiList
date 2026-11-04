"use client";

import { useSession } from "@/components/SessionContext";
import { SettingForm } from "@/components/SettingForm";
import { updateEmail } from "@/lib/api";

export default function AccountEmailPage() {
  const session = useSession();
  return (
    <SettingForm
      title="Account email"
      question="Where should account notices go?"
      label="Email"
      type="email"
      autoComplete="email"
      initial={session?.email ?? ""}
      save={updateEmail}
      savedNote="Check your new inbox and tap the link to finish the change."
    />
  );
}
