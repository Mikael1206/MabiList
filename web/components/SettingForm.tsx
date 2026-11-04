"use client";

import { useState, type FormEvent } from "react";
import { useSetSession } from "./SessionContext";
import { AppHeader, ErrorNote, Field, btn } from "./ui";
import type { Session } from "@/lib/types";

/** One-field edit screen (Figma Settings/shopName and Settings/accountEmail, with their "saved" state). */
export function SettingForm({
  title,
  question,
  label,
  type = "text",
  autoComplete,
  initial,
  save,
  savedNote,
}: {
  title: string;
  question: string;
  label: string;
  type?: string;
  autoComplete: string;
  initial: string;
  save: (value: string) => Promise<Session>;
  /** Shown after a successful save. */
  savedNote?: string;
}) {
  const setSession = useSetSession();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return setError(`Add your ${label.toLowerCase()} first.`);
    setBusy(true);
    setError(null);
    try {
      setSession(await save(value.trim()));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn’t save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AppHeader title={title} backHref="/settings" />
      <main className="px-4 pb-12 pt-7">
        <h2 className="pb-2 font-display text-[29px] leading-[30.73px] tracking-[-1.16px]">{question}</h2>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <Field
            id="value"
            label={label}
            type={type}
            autoComplete={autoComplete}
            required
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
          />
          <div aria-live="polite">
            {error && <ErrorNote>{error}</ErrorNote>}
            {saved && savedNote && <p className="font-body text-base">{savedNote}</p>}
          </div>
          <div>
            <button type="submit" disabled={busy || saved} className={btn.primary}>
              {busy ? "Saving…" : saved ? "Saved" : "Save changes"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
