import Link from "next/link";
import { AdminNav } from "@/app/admin/_ui/AdminNav";
import { formatAbsoluteTime } from "@/app/admin/_ui/relative-time";
import { siteUrl } from "@/lib/site";

type Props = {
  sessionExpiresAt: Date;
  now: Date;
  unread: number | null;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Floored, so "6 d" means at least six days; the exact moment is in the title attribute.
function formatRemaining(ms: number) {
  if (ms >= DAY_MS) return `${Math.floor(ms / DAY_MS)} d`;
  if (ms >= HOUR_MS) return `${Math.floor(ms / HOUR_MS)} h`;
  return `${Math.max(1, Math.floor(ms / 60_000))} min`;
}

export function AdminHeader({ sessionExpiresAt, now, unread }: Props) {
  return (
    <header className="border-b border-line bg-ground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 px-5 sm:px-8">
        <p className="flex h-14 items-center font-mono text-[12px] text-ink-faint">
          <a href={siteUrl} className="hover:text-accent">
            mehulgupta.me
          </a>
          <span aria-hidden="true" className="px-1.5 text-line-bright">
            /
          </span>
          <Link href="/" className="text-ink hover:text-accent">
            admin
          </Link>
        </p>

        <AdminNav unread={unread} />

        <div className="flex h-14 items-center gap-4">
          <p className="hidden font-mono text-[11px] text-ink-faint sm:block">
            Session ends in{" "}
            <time
              dateTime={sessionExpiresAt.toISOString()}
              title={formatAbsoluteTime(sessionExpiresAt)}
              className="tabular-nums"
            >
              {formatRemaining(sessionExpiresAt.getTime() - now.getTime())}
            </time>
          </p>
          <form method="post" action="/api/admin/session">
            <input type="hidden" name="intent" value="signout" />
            <button
              type="submit"
              className="inline-flex min-h-9 items-center border border-line-bright px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim hover:border-accent hover:text-accent"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
