import { formatAbsoluteTime, formatRelativeTime, formatShortDate } from "@/app/admin/_ui/relative-time";
import { buildReplyHref } from "@/app/admin/messages/reply-link";
import { buttonStyles } from "@/app/admin/_ui/styles";
import type { Message, MessageStatus } from "@/lib/db/messages";

type Props = {
  message: Message;
  now: Date;
};

const statusStyles: Record<MessageStatus, string> = {
  new: "border-accent/45 text-accent",
  read: "border-line text-ink-faint",
  replied: "border-line-bright text-ink-dim",
  archived: "border-line text-ink-faint",
};

// Only the moves that make sense from each state; "new" doubles as mark-unread.
const transitions: Record<MessageStatus, { to: MessageStatus; label: string }[]> = {
  new: [
    { to: "read", label: "Mark read" },
    { to: "replied", label: "Mark replied" },
  ],
  read: [
    { to: "replied", label: "Mark replied" },
    { to: "new", label: "Mark unread" },
  ],
  replied: [{ to: "new", label: "Mark unread" }],
  archived: [{ to: "new", label: "Mark unread" }],
};

function StatusTag({ status }: { status: MessageStatus }) {
  return (
    <span
      className={`border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${statusStyles[status]}`}
    >
      <span className="sr-only">Status: </span>
      {status}
    </span>
  );
}

function StatusButton({ id, to, label, context }: { id: string; to: MessageStatus; label: string; context: string }) {
  return (
    <form method="post" action={`/api/admin/messages/${id}`}>
      <input type="hidden" name="status" value={to} />
      <button type="submit" className={buttonStyles.default}>
        {label}
        <span className="sr-only">, {context}</span>
      </button>
    </form>
  );
}

export function MessageCard({ message, now }: Props) {
  const headingId = `m-${message.id}-from`;
  const context = `message from ${message.name}`;

  return (
    <article aria-labelledby={headingId}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h2 id={headingId} className="font-display text-xl tracking-tight break-words text-ink sm:text-2xl">
            {message.name}
          </h2>
          <p className="mt-1 font-mono text-[12px] break-all text-ink-dim">{message.email}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2">
          <StatusTag status={message.status} />
          <time
            dateTime={message.createdAt.toISOString()}
            title={formatAbsoluteTime(message.createdAt)}
            className="font-mono text-[11px] tracking-[0.04em] text-ink-faint"
          >
            {formatRelativeTime(message.createdAt, now)}
          </time>
        </div>
      </header>

      <p className="mt-5 max-w-[70ch] leading-relaxed break-words whitespace-pre-wrap text-ink">
        {message.message}
      </p>

      <div className="mt-6 flex flex-col gap-2 border-t border-line pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <a href={buildReplyHref(message, formatShortDate(message.createdAt))} className={buttonStyles.accent}>
          Reply
          <span className="sr-only">, {context}</span>
        </a>
        {transitions[message.status].map(({ to, label }) => (
          <StatusButton key={to} id={message.id} to={to} label={label} context={context} />
        ))}
        <span className="font-mono text-[10px] tracking-[0.08em] text-ink-faint sm:ml-auto">
          ID {message.id.slice(0, 8)}
        </span>
      </div>
    </article>
  );
}
