export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-line bg-surface px-2 py-1 font-mono text-[11px] tracking-[0.04em] text-ink-dim">
      {children}
    </span>
  );
}
