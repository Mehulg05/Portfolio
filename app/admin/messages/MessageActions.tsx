import type { ReactNode } from "react";
import { formatShortDate } from "@/app/admin/_ui/relative-time";
import { buttonStyles } from "@/app/admin/_ui/styles";
import { buildReplyHref } from "@/app/admin/messages/reply-link";
import type { Message, MessageStatus } from "@/lib/db/messages";

type Props = {
  message: Message;
  /** Where every action lands afterwards: the current view with this message open. */
  returnTo: string;
  /** Archive and unarchive drop the message out of the current list, so they land on its neighbour. */
  advanceTo: string;
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
  archived: [],
};

/** Unarchiving restores the furthest state the timestamps prove; it was read to be archived. */
export function unarchivedStatus(message: Pick<Message, "repliedAt">): MessageStatus {
  return message.repliedAt ? "replied" : "read";
}

function ActionForm({
  id,
  fields,
  returnTo,
  shortcut,
  className = buttonStyles.default,
  children,
}: {
  id: string;
  fields: Record<string, string>;
  returnTo: string;
  shortcut?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form method="post" action={`/api/admin/messages/${id}`} data-shortcut={shortcut}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input type="hidden" name="return" value={returnTo} />
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}

export function MessageActions({ message, returnTo, advanceTo }: Props) {
  const archived = message.status === "archived";

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <a
        href={buildReplyHref(message, formatShortDate(message.createdAt))}
        data-shortcut="reply"
        className={`${buttonStyles.accent} col-span-2`}
      >
        Reply
        <kbd className="hidden font-mono text-[10px] opacity-60 lg:inline">R</kbd>
      </a>
      {transitions[message.status].map(({ to, label }) => (
        <ActionForm key={to} id={message.id} fields={{ status: to }} returnTo={returnTo}>
          {label}
        </ActionForm>
      ))}
      <ActionForm
        id={message.id}
        fields={{ status: archived ? unarchivedStatus(message) : "archived" }}
        returnTo={advanceTo}
        shortcut="archive"
      >
        {archived ? "Unarchive" : "Archive"}
        <kbd className="hidden font-mono text-[10px] opacity-60 lg:inline">E</kbd>
      </ActionForm>
    </div>
  );
}
