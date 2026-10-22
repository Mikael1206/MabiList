"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/AuthShell";
import { PasswordField } from "@/components/PasswordField";
import { ErrorNote, Field, btn } from "@/components/ui";
import { ApiError, signUp } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!shopName.trim()) return setError("Add your shop name so we can label your logbook.");
    if (!email.includes("@")) return setError("That email doesn’t look right. Check it and try again.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (password !== confirm) return setError("The two passwords don’t match. Type them again.");
    setBusy(true);
    try {
      await signUp(shopName.trim(), email.trim(), password);
      router.replace("/logbook");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn’t reach MabiList. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <form onSubmit={onSubmit} noValidate className="flex flex-col">
        <p className="font-display text-[13px] font-semibold text-muted">New seller account</p>
        <h1 className="pb-[10px] pt-2 font-display text-[29px] font-semibold leading-[30.73px] tracking-[-1.16px]">
          Create your logbook
        </h1>
        <p className="font-body text-base text-muted">Set up a logbook for your shop orders.</p>

        <div className="pt-4" aria-live="polite">
          {error && <ErrorNote>{error}</ErrorNote>}
        </div>

        <div className="grid gap-4 pt-2">
          <Field
            id="shop"
            label="Shop name"
            placeholder="Your shop name"
            autoComplete="organization"
            required
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PasswordField id="password" label="Password" autoComplete="new-password" value={password} onChange={setPassword} />
          <PasswordField id="confirm" label="Confirm password" autoComplete="new-password" value={confirm} onChange={setConfirm} />
        </div>

        <button type="submit" disabled={busy} className={`${btn.gradient} mt-6`}>
          {busy ? "Creating account…" : "Create account"}
        </button>

        <p className="mt-[18px] flex items-center justify-center gap-[5px] border-t-[1.25px] border-line pt-4 text-sm text-muted">
          Already have a seller account?
          <Link href="/sign-in" className="flex min-h-11 items-center font-extrabold text-ink underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
