"use client";

import { useSession } from "@/components/SessionContext";
import { SettingForm } from "@/components/SettingForm";
import { updateShopName } from "@/lib/api";

export default function ShopNamePage() {
  const session = useSession();
  return (
    <SettingForm
      title="Shop name"
      question="What should we call your shop?"
      label="Shop name"
      autoComplete="organization"
      initial={session?.shop_name ?? ""}
      save={updateShopName}
    />
  );
}
