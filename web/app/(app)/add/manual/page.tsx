"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrderForm } from "@/components/OrderForm";
import { AppHeader, PageTitle, btn } from "@/components/ui";
import { createManualOrder } from "@/lib/api";

export default function ManualOrderPage() {
  const router = useRouter();
  return (
    <>
      <AppHeader title="Enter order by hand" backHref="/add" />
      <main className="px-4 pb-12 pt-7">
        <PageTitle eyebrow="No chat needed">Add the order details</PageTitle>
        <OrderForm
          showPayment={false}
          onSubmit={async (input) => {
            const order = await createManualOrder(input);
            router.push(`/orders/${order.id}`);
          }}
          actions={(busy) => (
            <div className="flex gap-1">
              <button type="submit" disabled={busy} className={btn.primary}>
                {busy ? "Saving…" : "Save order"}
              </button>
              <Link href="/add" className={btn.plain}>
                Cancel
              </Link>
            </div>
          )}
        />
      </main>
    </>
  );
}
