import type { ReactNode } from "react";

/*
  The sheet furniture the three dashboards share: a page header, framed panels and a
  hairline grid of stat cells. Kept next to the charts because every chart sits in one.
*/

export const monoLabel = "font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint";

export function PageHeader({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-line pb-4 sm:mb-8">
      <h1 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">{title}</h1>
      {meta ? <div className={`${monoLabel} flex flex-wrap gap-x-4 gap-y-1 tabular-nums`}>{meta}</div> : null}
    </header>
  );
}

type PanelProps = {
  id: string;
  title: string;
  /** Right side of the panel header: a link, a unit, a caption. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Panel({ id, title, aside, children, className = "" }: PanelProps) {
  const headingId = `${id}-title`;
  return (
    <section aria-labelledby={headingId} className={`tick-frame min-w-0 border border-line bg-ground p-4 sm:p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={headingId} className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
          {title}
        </h2>
        {aside ? <div className={`${monoLabel} tabular-nums`}>{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function StatGrid({ children, className = "grid-cols-2 sm:grid-cols-4" }: { children: ReactNode; className?: string }) {
  return <dl className={`grid gap-px border border-line bg-line ${className}`}>{children}</dl>;
}

type StatProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "ink" | "accent" | "redline" | "faint";
};

const valueTones = {
  ink: "text-ink",
  accent: "text-accent",
  redline: "text-redline",
  faint: "text-ink-faint",
} as const;

export function Stat({ label, value, detail, tone = "ink" }: StatProps) {
  return (
    <div className="min-w-0 bg-ground p-4">
      <dt className={monoLabel}>{label}</dt>
      <dd className={`mt-2 font-display text-2xl leading-none tabular-nums ${valueTones[tone]}`}>{value}</dd>
      {detail ? <dd className="mt-2 truncate font-mono text-[10px] text-ink-faint tabular-nums">{detail}</dd> : null}
    </div>
  );
}
