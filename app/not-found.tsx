import type { CSSProperties } from "react";
import Link from "next/link";

/*
  A missing sheet in the set. Same grid, tick-framed title block and mono labels as the
  page, and nothing that moves beyond the hero's own rise: a 404 is a dead end, and the
  job here is to get the visitor back in one click.
*/
const titleBlock = [
  { label: "Status", value: "404", tone: "text-redline" },
  { label: "Address", value: "Not found", tone: "text-ink" },
  { label: "Next", value: "Back to the page", tone: "text-ink" },
];

export default function NotFound() {
  return (
    <main id="top" className="relative flex min-h-svh flex-1 items-center overflow-hidden">
      <div className="sheet-grid pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
        <div className="tick-frame border-t border-line pt-6">
          <p
            className="hero-rise font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint"
            style={{ "--step": 0 } as CSSProperties}
          >
            Error <span className="text-redline">404</span>
          </p>
          <h1
            className="hero-rise mt-4 font-display text-4xl tracking-tight text-ink sm:text-5xl"
            style={{ "--step": 1 } as CSSProperties}
          >
            There is no page at this address.
          </h1>
          <p
            className="hero-rise mt-4 max-w-[52ch] text-base leading-relaxed text-ink-dim"
            style={{ "--step": 2 } as CSSProperties}
          >
            The link may be old or mistyped. Everything on the site is on one page.
          </p>

          <div
            className="hero-rise mt-8 flex flex-wrap items-center gap-3"
            style={{ "--step": 3 } as CSSProperties}
          >
            <Link
              href="/"
              className="inline-flex min-h-11 items-center bg-accent px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ground hover:bg-ink"
            >
              Back to the page
            </Link>
            <Link
              href="/#contact"
              className="inline-flex min-h-11 items-center border border-line-bright px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-dim hover:border-accent hover:text-accent"
            >
              Get in touch
            </Link>
          </div>
        </div>

        <dl
          className="hero-rise mt-14 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3"
          style={{ "--step": 4 } as CSSProperties}
        >
          {titleBlock.map((item) => (
            <div key={item.label} className="bg-ground px-4 py-3.5">
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {item.label}
              </dt>
              <dd className={`mt-1.5 text-sm ${item.tone}`}>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
