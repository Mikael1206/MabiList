"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/AuthShell";
import { PasswordField } from "@/components/PasswordField";
import { ErrorNote, Field, btn } from "@/components/ui";
import { ApiError, requestPasswordReset, signIn } from "@/lib/api";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResetSentTo(null);
    try {
      await signIn(email.trim(), password);
      router.replace("/logbook");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn’t reach MabiList. Check your connection and try again.");
      setBusy(false);
    }
  }

  async function onForgot() {
    setError(null);
    if (!email.includes("@")) {
      setError("Type your email above first, then tap Forgot password.");
      return;
    }
    try {
      await requestPasswordReset(email.trim());
      setResetSentTo(email.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn’t reach MabiList. Check your connection and try again.");
    }
  }

  return (
    <AuthShell>
      <form onSubmit={onSubmit} noValidate className="flex flex-col">
        <p className="font-display text-[13px] font-semibold text-muted">MabiList seller account</p>
        <h1 className="pb-[10px] pt-2 font-display text-[29px] font-semibold leading-[30.73px] tracking-[-1.16px]">
          Sign in to your logbook
        </h1>
        <p className="font-body text-base text-muted">Use the email for your seller account to continue.</p>

        <div className="pt-4" aria-live="polite">
          {error && <ErrorNote>{error}</ErrorNote>}
          {resetSentTo && (
            <p className="rounded-[10px] border-l-4 border-amber bg-[#f5e6cc] px-4 py-3 font-body text-base">
              If there’s an account, password reset instructions were sent to <strong>{resetSentTo}</strong>.
            </p>
          )}
        </div>

        <div className="grid gap-4 pt-2">
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PasswordField id="password" label="Password" autoComplete="current-password" value={password} onChange={setPassword} />
        </div>

        <button type="button" onClick={onForgot} className="ml-auto min-h-11 pb-[10px] pt-2 text-[13px] font-bold underline">
          Forgot password?
        </button>

        <button type="submit" disabled={busy} className={btn.gradient}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-[18px] flex items-center justify-center gap-[5px] border-t-[1.25px] border-line pt-4 text-sm text-muted">
          New to MabiList?
          <Link href="/sign-up" className="flex min-h-11 items-center font-extrabold text-ink underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
