// Scripted chat reading for the pitch demo (ADR-017, TASK-027). Each team-made synthetic
// screenshot in `public/demo/` maps to the draft its chat supports, and nothing more (INV-003).
// Removed with the rest of the demo code when real extraction lands (TASK-030).

import { addDays } from "../format";
import type { ChatLine, ExtractionInput, OrderField, OrderInput } from "../types";

export type ScriptId = "complete-order" | "order-change" | "missing-fields";

export interface DemoScript {
  id: ScriptId;
  /** Byte sizes of the screenshot files, which survive a download to the phone unchanged. */
  sizes: number[];
  names: string[];
  /** Phrases that identify the same chat when it is pasted as text (lower case). */
  pasteMarkers: string[];
  draft: (today: string) => OrderInput;
  notInChat: OrderField[];
  excerpt: ChatLine[];
  /** Update to the seeded order with this id key instead of a new order. */
  updates?: "mika";
}

/** Next date (YYYY-MM-DD) after `today` that falls on `weekday` (0 = Sunday). */
export function nextWeekday(today: string, weekday: number): string {
  const current = new Date(`${today}T00:00:00Z`).getUTCDay();
  return addDays(today, (weekday - current + 7) % 7 || 7);
}

const WEDNESDAY = 3;
const FRIDAY = 5;

export const DEMO_SCRIPTS: DemoScript[] = [
  {
    id: "complete-order",
    sizes: [91801],
    names: ["chat-1-complete-order.jpg"],
    pasteMarkers: ["ube pandesal", "360"],
    draft: (today) => ({
      customer_name: "Angelica Reyes",
      items: [{ name: "Ube pandesal", quantity: 2, unit_price_php: 180 }],
      total_php: 360,
      delivery_date: nextWeekday(today, WEDNESDAY),
      payment_status: "paid",
    }),
    notInChat: [],
    excerpt: [
      { from_customer: true, text: "Hi po! Pwede po ba two boxes ng ube pandesal sa Wednesday?", highlights: ["two boxes", "ube pandesal", "Wednesday"] },
      { from_customer: false, text: "Hello po, yes po! 1 box = 12 pcs. 180 pesos per box po", highlights: ["180 pesos per box"] },
      { from_customer: true, text: "Okay po. Magkano total po?", highlights: [] },
      { from_customer: false, text: "360 pesos po! Pa send nalang po gcash!", highlights: ["360 pesos"] },
      { from_customer: true, text: "Sent na po!", highlights: ["Sent na po"] },
      { from_customer: false, text: "Recieved po, salamat!! See you Wednesday", highlights: ["Recieved po"] },
    ],
  },
  {
    id: "order-change",
    sizes: [94567],
    names: ["chat-2-order-change.jpg"],
    pasteMarkers: ["ensaymada", "135"],
    // Only the change lines are highlighted: they are what the update was read from.
    draft: (today) => ({
      customer_name: "Mika Santos",
      items: [{ name: "Ensaymada", quantity: 3, unit_price_php: 45 }],
      total_php: 135,
      delivery_date: nextWeekday(today, FRIDAY),
      // "Babayaran ko na lang pagdating" — she pays on arrival, so it is still unpaid.
      payment_status: "unpaid",
    }),
    notInChat: [],
    excerpt: [
      { from_customer: true, text: "Kuya, order po sana ako ng 5 ensaymada para sa Friday", highlights: [] },
      { from_customer: false, text: "Sige po! 45 pesos each po. 225 pesos ang total.", highlights: [] },
      { from_customer: true, text: "Sige po. Babayaran ko na lang pagdating", highlights: [] },
      { from_customer: true, text: "Kuya, 3 na lang po pala. Di na pupunta yung dalawa 😅", highlights: ["3 na lang po pala"] },
      { from_customer: false, text: "Okay po, bali 135 pesos na po total!", highlights: ["135 pesos"] },
    ],
    updates: "mika",
  },
  {
    id: "missing-fields",
    sizes: [720378],
    names: ["chat-3-missing-fields.jpg", "chat-3-missing-fields.png", "chat-3-missing-fields.webp"],
    pasteMarkers: ["banana loaf"],
    // "Carla M." is in the chat header. Price, date and payment are never said, so they stay blank.
    draft: () => ({
      customer_name: "Carla M.",
      items: [{ name: "Banana loaf (large)", quantity: 2, unit_price_php: null }],
      total_php: null,
      delivery_date: null,
      payment_status: "not_stated",
    }),
    notInChat: ["total_php", "delivery_date", "payment_status"],
    excerpt: [
      { from_customer: true, text: "Hi po, magkano po yung banana loaf?", highlights: ["banana loaf"] },
      { from_customer: false, text: "Hello po! Depende po sa size, may small at large po.", highlights: [] },
      { from_customer: true, text: "Ah ok po. Dalawang large po sana.", highlights: ["Dalawang large"] },
      { from_customer: false, text: "Noted po! Message ko po kayo kung kelan available.", highlights: [] },
    ],
  },
];

/** The script a screenshot or pasted chat belongs to, or null when it isn't one of the demo chats. */
export function matchScript(input: ExtractionInput): DemoScript | null {
  if (input.kind === "text") {
    const text = input.text.toLowerCase();
    return DEMO_SCRIPTS.find((s) => s.pasteMarkers.every((m) => text.includes(m))) ?? null;
  }
  // Every screenshot in one upload must be the same demo chat.
  const scripts = input.files.map(
    (f) => DEMO_SCRIPTS.find((s) => s.sizes.includes(f.size) || s.names.includes(f.name)) ?? null,
  );
  const first = scripts[0];
  return first && scripts.every((s) => s === first) ? first : null;
}
