import Link from "next/link";
import { formatAbsoluteTime, formatRelativeTime } from "@/app/admin/_ui/relative-time";
import { labelStyle } from "@/app/admin/_ui/styles";
import { DeleteConfirm } from "@/app/admin/messages/DeleteConfirm";
import { MessageActions } from "@/app/admin/messages/MessageActions";
import { StatusTag } from "@/app/admin/messages/StatusTag";
import { CopyButton } from "@/components/ui/CopyButton";
import type { Message } from "@/lib/db/messages";

type Props = {
  message: Message;
  now: Date;
  backHref: string;
  returnTo: string;
  advanceTo: string;
};

export function BackToList({ href }: { href: string }) {
  return (
    <div className="border-b border-line px-5 py-3 sm:px-7 lg:hidden">
      <Link href={href} className={`${labelStyle} inline-flex min-h-11 items-center gap-2 text-accent hover:text-ink`}>
        <span aria-hidden="true">&larr;</span> Back to list
      </Link>
    </div>
  );
}

function Stamp({ label, date, now }: { label: string; date: Date; now: Date }) {
  return (
    <div className="min-w-0 bg-ground px-5 py-3 sm:px-7">
      <dt className={labelStyle}>{label}</dt>
      <dd className="mt-1 font-mono text-[12px] tabular-nums text-ink-dim">
        <time dateTime={date.toISOString()}>{formatAbsoluteTime(date)}</time>
        <span className="text-ink-faint"> · {formatRelativeTime(date, now)}</span>
      </dd>
    </div>
  );
}

export function MessageDetail({ message, now, backHref, returnTo, advanceTo }: Props) {
  const stamps = [
    { label: "Received", date: message.createdAt },
    { label: "Read", date: message.readAt },
    { label: "Replied", date: message.repliedAt },
    // archived_at survives an unarchive; it only describes the current state while archived.
    { label: "Archived", date: message.status === "archived" ? message.archivedAt : null },
  ].filter((stamp): stamp is { label: string; date: Date } => stamp.date !== null);

  return (
    <article aria-labelledby="message-from">
      <BackToList href={backHref} />

      <header className="px-5 pt-6 pb-5 sm:px-7">
        <div className="flex items-center justify-between gap-3">
          <p className={labelStyle}>From</p>
          <StatusTag status={message.status} />
        </div>
        <h2 id="message-from" className="mt-2 font-display text-2xl tracking-tight break-words text-ink sm:text-3xl">
          {message.name}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="min-w-0 font-mono text-[12px] break-all text-ink-dim">{message.email}</p>
          <CopyButton value={message.email} context="email address" />
        </div>
      </header>

      <dl className="grid grid-cols-1 gap-px border-y border-line bg-line sm:grid-cols-2">
        {stamps.map((stamp) => (
          <Stamp key={stamp.label} label={stamp.label} date={stamp.date} now={now} />
        ))}
        {/* Keeps the hairline grid rectangular when the stamp count is odd. */}
        {stamps.length % 2 === 1 && <div aria-hidden="true" className="hidden bg-ground sm:block" />}
      </dl>

      <div className="px-5 py-7 sm:px-7">
        <p className="max-w-[70ch] text-[15px] leading-relaxed break-words whitespace-pre-wrap text-ink">
          {message.message}
        </p>
      </div>

      <footer className="border-t border-line px-5 py-5 sm:px-7">
        <MessageActions message={message} returnTo={returnTo} advanceTo={advanceTo} />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="font-mono text-[10px] tracking-[0.08em] text-ink-faint tabular-nums">
            ID {message.id.slice(0, 8)} · {message.notifiedAt ? "email alert sent" : "no email alert"}
          </p>
          <DeleteConfirm id={message.id} name={message.name} returnTo={returnTo} />
        </div>
      </footer>
    </article>
  );
}
