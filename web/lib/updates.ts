import { peso, shortDate } from "./format";
import type { Order, ProposedChange } from "./types";

const PAYMENT_LABEL = { paid: "Paid", unpaid: "Unpaid", not_stated: "Not stated" } as const;

/**
 * Field-by-field changes an order-update draft proposes for its target (F-005, design-brief §2).
 * Fields the chat didn't state are never proposed, so nothing on the target is overwritten with a
 * blank (INV-003, INV-006).
 */
export function proposedChanges(draft: Order, target: Order): ProposedChange[] {
  const changes: ProposedChange[] = [];
  const stated = (f: Order["not_in_chat"][number]) => !draft.not_in_chat.includes(f);
  const d = draft.items[0];
  const t = target.items[0];

  if (stated("items") && d && t && d.name.toLowerCase() !== t.name.toLowerCase()) {
    changes.push({ field: "items", label: "Item", before: t.name, after: d.name });
  }
  if (stated("items") && d && t && d.quantity !== t.quantity) {
    changes.push({ field: "quantity", label: "Quantity", before: String(t.quantity), after: String(d.quantity) });
  }
  if (stated("total_php") && draft.total_php !== null && draft.total_php !== target.total_php) {
    changes.push({
      field: "total_php",
      label: "Total",
      before: target.total_php === null ? "No price" : peso(target.total_php),
      after: peso(draft.total_php),
    });
  }
  if (stated("delivery_date") && draft.delivery_date && draft.delivery_date !== target.delivery_date) {
    changes.push({
      field: "delivery_date",
      label: "Delivery date",
      before: target.delivery_date ? shortDate(target.delivery_date) : "Not set",
      after: shortDate(draft.delivery_date),
    });
  }
  if (stated("payment_status") && draft.payment_status !== "not_stated" && draft.payment_status !== target.payment_status) {
    changes.push({
      field: "payment_status",
      label: "Payment",
      before: PAYMENT_LABEL[target.payment_status],
      after: PAYMENT_LABEL[draft.payment_status],
    });
  }
  return changes;
}
