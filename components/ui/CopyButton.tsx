"use client";

import { useEffect, useState } from "react";

export function CopyButton({ value, context }: { value: string; context: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex items-center gap-2 border border-line-bright px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim hover:border-accent hover:text-accent"
    >
      {copied ? "Copied" : "Copy"}
      <span className="sr-only">, {context}</span>
    </button>
  );
}
