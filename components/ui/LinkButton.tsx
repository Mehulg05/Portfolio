import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  /**
   * Appended to the accessible name, visually hidden, so the label still identifies
   * its destination when read out of context ("Product site" → "Product site, BoSS").
   */
  context?: string;
  /** Same-origin destinations that still leave the page, e.g. a PDF. */
  newTab?: boolean;
  tone?: "default" | "accent";
};

const tones = {
  default:
    "border-line-bright text-ink-dim hover:border-accent hover:text-accent",
  accent: "border-accent bg-accent text-ground hover:border-ink hover:bg-ink",
} as const;

export function LinkButton({ href, children, context, newTab, tone = "default" }: Props) {
  const isExternal = /^https?:\/\//i.test(href);
  const opensNewTab = isExternal || newTab === true;

  return (
    <a
      href={href}
      target={opensNewTab ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`inline-flex items-center gap-2 border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] ${tones[tone]}`}
    >
      <span>
        {children}
        {context ? <span className="sr-only">, {context}</span> : null}
      </span>
      {opensNewTab ? <span aria-hidden="true">↗</span> : null}
    </a>
  );
}
