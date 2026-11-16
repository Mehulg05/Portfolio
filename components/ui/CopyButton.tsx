"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "copied" | "failed";

export function CopyButton({ value, context }: { value: string; context: string }) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      // Clipboard access is refused outside secure contexts and when permission is denied.
      setStatus("failed");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className={`inline-flex min-h-11 items-center gap-2 border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] hover:border-accent hover:text-accent sm:min-h-10 ${
          status === "failed" ? "border-redline text-redline" : "border-line-bright text-ink-dim"
        }`}
      >
        {status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy"}
        <span className="sr-only">, {context}</span>
      </button>
      <span role="status" className="sr-only">
        {status === "copied" ? `Copied ${context}` : status === "failed" ? `Could not copy ${context}. Select it by hand.` : ""}
      </span>
    </>
  );
}
