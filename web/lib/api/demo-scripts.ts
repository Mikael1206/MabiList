// Scripted chat reading for the pitch demo (ADR-017, TASK-027). Each team-made synthetic
// screenshot in `public/demo/` maps to the draft its chat supports, and nothing more (INV-003).
// Removed with the rest of the demo code when real extraction lands (TASK-030).

import { addDays } from "../format";
import type { ChatLine, ExtractionInput, OrderField, OrderInput } from "../types";

export interface ImageSize {
  width: number;
  height: number;
}

export type ScriptId = "complete-order" | "order-change" | "missing-fields";

export interface DemoScript {
  id: ScriptId;
  /** Byte sizes of the screenshot files (exact copies). */
  sizes: number[];
  /** Pixel size: survives a phone saving the picture as a different file (TASK-027 fix). */
  pixels: ImageSize;
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
    pixels: { width: 1232, height: 1277 },
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
    pixels: { width: 879, height: 1790 },
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
    pixels: { width: 844, height: 1863 },
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

// Tight on purpose: an ordinary 1080×2400 phone screenshot is within 0.7% of chat 3's shape.
const SHAPE_TOLERANCE = 0.003;

function byPixels(size: ImageSize | null | undefined): DemoScript | null {
  if (!size) return null;
  const exact = DEMO_SCRIPTS.find((s) => s.pixels.width === size.width && s.pixels.height === size.height);
  if (exact) return exact;
  // Resized copy (e.g. a phone that shrinks big images): same shape, never larger.
  const ratio = size.width / size.height;
  return (
    DEMO_SCRIPTS.find(
      (s) =>
        size.width < s.pixels.width &&
        Math.abs(ratio / (s.pixels.width / s.pixels.height) - 1) <= SHAPE_TOLERANCE,
    ) ?? null
  );
}

/**
 * The script a screenshot or pasted chat belongs to, or null when it isn't one of the demo chats.
 * Screenshots match by exact file size or name first, then by pixel size or shape (`sizes` comes
 * from `readImageSizes`), because phones often save a downloaded picture as a different file.
 */
export function matchScript(input: ExtractionInput, sizes: (ImageSize | null)[] = []): DemoScript | null {
  if (input.kind === "text") {
    const text = input.text.toLowerCase();
    return DEMO_SCRIPTS.find((s) => s.pasteMarkers.every((m) => text.includes(m))) ?? null;
  }
  // Every screenshot in one upload must be the same demo chat.
  const scripts = input.files.map(
    (f, i) =>
      DEMO_SCRIPTS.find((s) => s.sizes.includes(f.size) || s.names.includes(f.name)) ?? byPixels(sizes[i]),
  );
  const first = scripts[0];
  return first && scripts.every((s) => s === first) ? first : null;
}

/** Pixel size of each picture, or null where the browser can't decode it. */
export async function readImageSizes(files: File[]): Promise<(ImageSize | null)[]> {
  return Promise.all(
    files.map(async (file) => {
      try {
        const bitmap = await createImageBitmap(file);
        const size = { width: bitmap.width, height: bitmap.height };
        bitmap.close();
        return size;
      } catch {
        return null; // not decodable here (or no createImageBitmap, e.g. in tests)
      }
    }),
  );
}
