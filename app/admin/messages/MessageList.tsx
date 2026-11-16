import Link from "next/link";
import { formatAbsoluteTime, formatRelativeTime } from "@/app/admin/_ui/relative-time";
import { StatusDot, StatusTag } from "@/app/admin/messages/StatusTag";
import { messagesHref, type MessagesState } from "@/app/admin/messages/url";
import type { Message } from "@/lib/db/messages";

type Props = {
  messages: Message[];
  state: MessagesState;
  now: Date;
};

const PREVIEW_LENGTH = 160;

// The first line with content; sliced by code point so an emoji is never cut in half.
function preview(text: string) {
  const line = text.split(/\r?\n/).find((part) => part.trim() !== "") ?? "";
  return Array.from(line.trim()).slice(0, PREVIEW_LENGTH).join("");
}

function Row({ message, state, now, selected }: { message: Message; state: MessagesState; now: Date; selected: boolean }) {
  const unread = message.status === "new";
  // In the inbox the dot already says "new"; the tag only earns its space for the other states.
  const showTag = message.status === "replied" || (message.status === "archived" && state.status !== "archived");

  return (
    <Link
      href={messagesHref({ ...state, id: message.id })}
      // Selection is URL state; the page must not jump to the top on every row change.
      // TriageKeys handles scrolling instead.
      scroll={false}
      prefetch={false}
      data-row-id={message.id}
      aria-current={selected ? "true" : undefined}
      className={`grid scroll-my-2 grid-cols-[6px_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 px-4 py-3 outline-accent focus-visible:outline focus-visible:-outline-offset-1 ${
        selected
          ? "bg-surface-2 shadow-[inset_2px_0_0_var(--color-accent)]"
          : unread
            ? "bg-surface hover:bg-surface-2"
            : "bg-ground hover:bg-surface"
      }`}
    >
      <span className="self-center">
        <StatusDot status={message.status} />
      </span>
      <span className={`truncate text-[14px] ${unread ? "font-semibold text-ink" : "text-ink-dim"}`}>
        {message.name}
      </span>
      <time
        dateTime={message.createdAt.toISOString()}
        title={formatAbsoluteTime(message.createdAt)}
        className={`font-mono text-[11px] tabular-nums ${unread ? "text-ink-dim" : "text-ink-faint"}`}
      >
        {formatRelativeTime(message.createdAt, now)}
      </time>
      <span aria-hidden="true" />
      <span className={`truncate text-[13px] ${unread ? "text-ink-dim" : "text-ink-faint"}`}>
        {preview(message.message) || <span className="italic">Empty message</span>}
      </span>
      <span className="justify-self-end">{showTag && <StatusTag status={message.status} />}</span>
    </Link>
  );
}

export function MessageList({ messages, state, now }: Props) {
  return (
    <ol aria-label="Messages, newest first" className="grid grid-cols-1 gap-px border-b border-line bg-line">
      {messages.map((message) => (
        <li key={message.id} id={`m-${message.id}`}>
          <Row message={message} state={state} now={now} selected={message.id === state.id} />
        </li>
      ))}
    </ol>
  );
}
