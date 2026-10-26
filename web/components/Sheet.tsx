"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Bottom sheet from the Figma connected-accounts frames. Escape or a tap on the scrim closes it. */
export function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/45" onMouseDown={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-t-[22px] bg-cream px-4 pb-8 pt-3 outline-none"
      >
        <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        {children}
      </div>
    </div>
  );
}
