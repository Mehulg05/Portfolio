import Link from "next/link";
import type { ReactNode } from "react";
import { labelStyle } from "@/app/admin/_ui/styles";
import { MessageList } from "@/app/admin/messages/MessageList";
import { SearchForm } from "@/app/admin/messages/SearchForm";
import { StatusTabs } from "@/app/admin/messages/StatusTabs";
import { TriageKeys } from "@/app/admin/messages/TriageKeys";
import { messagesHref, type MessagesState } from "@/app/admin/messages/url";
import { viewLabels } from "@/app/admin/messages/views";
import type { MessageCounts, MessagePage } from "@/lib/db/messages";

type Props = {
  state: MessagesState;
  page: MessagePage;
  counts: MessageCounts;
  now: Date;
};

function exportHref(state: MessagesState) {
  const params = new URLSearchParams();
  if (state.status !== "inbox") params.set("status", state.status);
  if (state.q) params.set("q", state.q);
  const query = params.toString();
  return `/api/admin/messages/export${query ? `?${query}` : ""}`;
}

function EmptyList({ state, counts }: { state: MessagesState; counts: MessageCounts }) {
  const total = counts.inbox + counts.archived;
  let text: ReactNode;
  if (state.cursor) text = "No older messages.";
  else if (state.q) text = <>No {state.status === "inbox" ? "" : `${viewLabels[state.status].toLowerCase()} `}messages match &ldquo;{state.q}&rdquo;.</>;
  else if (total === 0) text = "No messages yet. Contact form submissions land here.";
  else if (state.status === "new") text = "Nothing new. All caught up.";
  else text = `Nothing in ${viewLabels[state.status].toLowerCase()}.`;

  return <p className="bg-ground px-4 py-10 text-center font-mono text-[12px] leading-relaxed text-ink-faint">{text}</p>;
}

function Pager({ state, page, counts }: { state: MessagesState; page: MessagePage; counts: MessageCounts }) {
  if (!state.cursor && !page.nextCursor) {
    return (
      <p className={`${labelStyle} -mt-px border-t border-line bg-ground px-4 py-3 tabular-nums`}>
        {page.items.length} {page.items.length === 1 ? "message" : "messages"}
      </p>
    );
  }
  const linkStyle = `${labelStyle} inline-flex min-h-9 items-center gap-1.5 text-accent hover:text-ink`;
  return (
    <nav aria-label="Pages" className="-mt-px flex items-center justify-between gap-3 border-t border-line bg-ground px-4 py-2">
      <span className={`${labelStyle} tabular-nums`}>
        {page.items.length} {state.cursor ? "older" : "newest"} of {counts[state.status]}
      </span>
      <span className="flex items-center gap-4">
        {state.cursor && (
          <Link href={messagesHref({ status: state.status, q: state.q })} className={linkStyle}>
            Newest
          </Link>
        )}
        {page.nextCursor && (
          <Link href={messagesHref({ status: state.status, q: state.q, cursor: page.nextCursor })} className={linkStyle}>
            Older <span aria-hidden="true">&rarr;</span>
          </Link>
        )}
      </span>
    </nav>
  );
}

export function ListPane({ state, page, counts, now }: Props) {
  return (
    <section aria-labelledby="messages-heading" className="flex min-w-0 flex-col bg-ground">
      <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <h1 id="messages-heading" className="font-display text-xl tracking-tight text-ink">
          Messages
        </h1>
        <a
          href={exportHref(state)}
          className={`${labelStyle} inline-flex min-h-9 items-center hover:text-accent`}
          title={`Download ${viewLabels[state.status].toLowerCase()}${state.q ? " search results" : ""} as CSV`}
        >
          Export CSV
        </a>
      </header>
      <StatusTabs state={state} counts={counts} />
      <SearchForm state={state} />
      <div className="flex-1 border-t border-line bg-ground">
        {page.items.length > 0 ? (
          <MessageList messages={page.items} state={state} now={now} />
        ) : (
          <EmptyList state={state} counts={counts} />
        )}
      </div>
      <Pager state={state} page={page} counts={counts} />
      <TriageKeys selectedId={state.id} />
    </section>
  );
}
