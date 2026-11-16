import Link from "next/link";
import { labelStyle } from "@/app/admin/_ui/styles";

/*
  Rendered inside the admin layout, so it only ever appears behind the session gate and
  keeps the shell. Admin pages reach it through notFound() (an unknown message id, say).
*/
export default function AdminNotFound() {
  return (
    <section aria-labelledby="admin-404-title" className="tick-frame max-w-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5 sm:px-7">
        <p className={labelStyle}>Sheet · Not found</p>
        <p className={`${labelStyle} tabular-nums`}>
          <span className="text-redline">404</span>
        </p>
      </div>
      <div className="px-5 pt-6 pb-7 sm:px-7">
        <h1 id="admin-404-title" className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
          Nothing at this address
        </h1>
        <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-ink-dim">
          The page or record does not exist, or it was deleted.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-10 items-center border border-line-bright px-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim hover:border-accent hover:text-accent"
        >
          Back to overview
        </Link>
      </div>
    </section>
  );
}
