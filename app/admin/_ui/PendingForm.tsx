"use client";

import { useEffect, useState, type ReactNode } from "react";
import { buttonStyles } from "@/app/admin/_ui/styles";

type Props = {
  action: string;
  intent: string;
  /** Shown on the button while the request is in flight. */
  pendingLabel: string;
  label: string;
  variant: keyof typeof buttonStyles;
  children?: ReactNode;
  className?: string;
};

/*
  A real form post that also shows it was received: on submit the button disables and
  changes its label, which also stops a double click from sending twice. Without
  JavaScript it is the plain form. pageshow resets it when the browser restores the page
  from its back/forward cache.
*/
export function PendingForm({ action, intent, pendingLabel, label, variant, children, className }: Props) {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const reset = () => setPending(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <form method="post" action={action} onSubmit={() => setPending(true)} className={className}>
      <input type="hidden" name="intent" value={intent} />
      {children}
      <button type="submit" disabled={pending} aria-busy={pending} className={`${buttonStyles[variant]} mt-6`}>
        {pending ? pendingLabel : label}
      </button>
    </form>
  );
}
