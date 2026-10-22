"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderForm } from "@/components/OrderForm";
import { AppHeader, ErrorNote, PageTitle, btn } from "@/components/ui";
import { getOrder, updateOrder } from "@/lib/api";
import type { Order } from "@/lib/types";

export default function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrder(id)
      .then(setOrder)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  return (
    <>
      <AppHeader title="Edit order" backHref={`/orders/${id}`} />
      <main className="px-4 pb-12 pt-7">
        {error && <ErrorNote>{error}</ErrorNote>}
        {order && (
          <>
            <PageTitle eyebrow="Confirmed order">Change the details</PageTitle>
            <OrderForm
              initial={order}
              showPayment
              onSubmit={async (input) => {
                await updateOrder(order.id, input);
                router.push(`/orders/${order.id}`);
              }}
              actions={(busy) => (
                <div className="flex gap-1">
                  <button type="submit" disabled={busy} className={btn.primary}>
                    {busy ? "Saving…" : "Save changes"}
                  </button>
                  <Link href={`/orders/${order.id}`} className={btn.plain}>
                    Cancel
                  </Link>
                </div>
              )}
            />
          </>
        )}
      </main>
    </>
  );
}
