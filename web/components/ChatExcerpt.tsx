import type { ReactNode } from "react";
import type { ChatLine } from "@/lib/types";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function withHighlights(line: ChatLine): ReactNode[] {
  const phrases = line.highlights.filter(Boolean);
  if (phrases.length === 0) return [line.text];
  return line.text
    .split(new RegExp(`(${phrases.map(escape).join("|")})`, "gi"))
    .map((part, i) =>
      phrases.some((p) => p.toLowerCase() === part.toLowerCase()) ? (
        <mark key={i} className="bg-amber text-ink">
          {part}
        </mark>
      ) : (
        part
      ),
    );
}

/** Dark "Chat excerpt" band from the Figma "Check the entry" frame. Only drafts have one (INV-001). */
export function ChatExcerpt({ lines }: { lines: ChatLine[] }) {
  return (
    <section aria-label="Chat excerpt" className="-mx-4 -mt-7 mb-7 bg-ink px-4 py-6">
      {/* The Figma label is #586b65 on dark green (below WCAG AA); lightened to the line colour. */}
      <p className="text-[13px] font-bold text-line">Chat excerpt</p>
      <div className="grid gap-2 pt-2">
        {lines.map((line, i) => (
          <p
            key={i}
            className={`w-fit max-w-[88%] bg-cream px-3 py-3 font-body text-base leading-[23.2px] ${
              line.from_customer ? "rounded-[14px] rounded-bl-[3px]" : "ml-auto rounded-[14px] rounded-br-[3px]"
            }`}
          >
            {withHighlights(line)}
          </p>
        ))}
      </div>
      <p className="pt-2 text-[13px] font-bold text-line">Highlighted words are what we read the order from.</p>
    </section>
  );
}
