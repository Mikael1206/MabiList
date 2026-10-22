"use client";

import Image from "next/image";
import { useState, type FormEvent, type ReactNode } from "react";
import { ErrorNote, Field } from "./ui";
import type { Order, OrderField, OrderInput, PaymentStatus } from "@/lib/types";

const NOT_IN_CHAT = "Not mentioned in chat";

/**
 * The order fields from the Figma "Check the entry" and "Enter order by hand" frames.
 * shortcut: edits one item line; multi-item orders keep their first item editable only. Upgrade
 * when the design adds an item list.
 */
export function OrderForm({
  initial,
  notInChat = [],
  showPayment,
  onSubmit,
  actions,
}: {
  initial?: Order;
  notInChat?: OrderField[];
  showPayment: boolean;
  onSubmit: (input: OrderInput) => Promise<void>;
  actions: (busy: boolean) => ReactNode;
}) {
  const item = initial?.items[0];
  const [customer, setCustomer] = useState(initial?.customer_name ?? "");
  const [itemName, setItemName] = useState(item?.name ?? "");
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const [price, setPrice] = useState(initial?.total_php != null ? String(initial.total_php) : "");
  const [date, setDate] = useState(initial?.delivery_date ?? "");
  const [payment, setPayment] = useState<PaymentStatus>(initial?.payment_status ?? "not_stated");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const missing = (f: OrderField) => notInChat.includes(f);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    const total = price.trim() === "" ? null : Number(price);
    if (!itemName.trim()) return setError("Add what they ordered.");
    if (!Number.isInteger(qty) || qty < 1) return setError("Quantity must be a whole number, 1 or more.");
    if (total !== null && (!Number.isFinite(total) || total < 0)) return setError("Price must be a number, like 350.");
    setBusy(true);
    try {
      await onSubmit({
        customer_name: customer.trim() || null,
        items: [{ name: itemName.trim(), quantity: qty, unit_price_php: null }],
        total_php: total,
        delivery_date: date || null,
        payment_status: payment,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn’t save. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <Field
        id="customer"
        label="Customer name"
        notInChat={missing("customer_name")}
        placeholder={missing("customer_name") ? NOT_IN_CHAT : undefined}
        autoComplete="off"
        value={customer}
        onChange={(e) => setCustomer(e.target.value)}
      />
      <Field
        id="item"
        label="What they ordered"
        notInChat={missing("items")}
        placeholder={missing("items") ? NOT_IN_CHAT : undefined}
        autoComplete="off"
        required
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-[10px]">
        <Field
          id="quantity"
          label="Quantity"
          inputMode="numeric"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <Field
          id="price"
          label="Price"
          notInChat={missing("total_php")}
          placeholder={missing("total_php") ? NOT_IN_CHAT : "₱"}
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <Field
        id="date"
        label="Delivery date"
        notInChat={missing("delivery_date")}
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      {showPayment && (
        <div className="grid gap-[7px]">
          <div className="flex items-center justify-between">
            <label htmlFor="payment" className="font-body text-[13px] font-bold">
              Payment
            </label>
          </div>
          <div className="relative">
            <select
              id="payment"
              value={payment}
              onChange={(e) => setPayment(e.target.value as PaymentStatus)}
              className="min-h-[50px] w-full appearance-none rounded-[10px] border-[1.25px] border-line bg-field px-4 font-body text-base"
            >
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="not_stated">{missing("payment_status") ? NOT_IN_CHAT : "Not stated"}</option>
            </select>
            <Image src="/icons/dropdown.svg" alt="" width={10} height={6} className="pointer-events-none absolute right-4 top-[22px]" />
          </div>
        </div>
      )}

      <div aria-live="polite">{error && <ErrorNote>{error}</ErrorNote>}</div>
      {actions(busy)}
      {price.trim() === "" && (
        <p className="rounded-lg border-[1.25px] border-rust-line p-2 text-center text-xs text-rust">
          No price yet · This order won’t be included in totals.
        </p>
      )}
    </form>
  );
}
