"use client";

import { useState } from "react";
import { Field } from "./ui";

export function PasswordField(props: { id: string; label: string; autoComplete: string; value: string; onChange: (v: string) => void }) {
  const [shown, setShown] = useState(false);
  return (
    <Field
      id={props.id}
      label={props.label}
      type={shown ? "text" : "password"}
      autoComplete={props.autoComplete}
      required
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      trailing={
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-label={shown ? "Hide password" : "Show password"}
          className="min-h-11 min-w-[58px] pr-1 text-[13px] font-bold"
        >
          {shown ? "Hide" : "Show"}
        </button>
      }
    />
  );
}
