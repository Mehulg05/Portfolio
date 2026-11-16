import Link from "next/link";
import { messagesHref, type MessagesState } from "@/app/admin/messages/url";
import { viewLabels } from "@/app/admin/messages/views";
import { type MessageCounts, messageViews } from "@/lib/db/messages";

type Props = {
  state: MessagesState;
  counts: MessageCounts;
};

export function StatusTabs({ state, counts }: Props) {
  return (
    <nav aria-label="Filter by status">
      <ul className="grid grid-cols-5 gap-px border-y border-line bg-line">
        {messageViews.map((view) => {
          const active = view === state.status;
          const count = counts[view];
          return (
            <li key={view} className="min-w-0">
              <Link
                // Switching tabs keeps the search but starts at the newest page.
                href={messagesHref({ status: view, q: state.q })}
                // "true", not "page": the panel nav already marks /messages as the current page.
                aria-current={active ? "true" : undefined}
                className={`flex h-full flex-col gap-1 px-1.5 py-2.5 sm:px-2 outline-accent focus-visible:outline focus-visible:-outline-offset-1 ${
                  active
                    ? "bg-surface-2 text-ink shadow-[inset_0_2px_0_var(--color-accent)]"
                    : "bg-ground text-ink-faint hover:bg-surface hover:text-ink-dim"
                }`}
              >
                {/* Tracking tightens below sm so "Archived" fits a fifth of a 375px sheet. */}
                <span className="truncate font-mono text-[10px] uppercase tracking-[0.02em] sm:tracking-[0.08em]">{viewLabels[view]}</span>
                <span
                  className={`font-mono text-[13px] tabular-nums ${
                    view === "new" && count > 0 ? "text-accent" : active ? "text-ink" : "text-ink-dim"
                  }`}
                >
                  {count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
