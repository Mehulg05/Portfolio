import { MessageCard } from "@/app/admin/messages/MessageCard";
import type { Message } from "@/lib/db/messages";

type Props = {
  messages: Message[];
  now: Date;
};

export function MessageList({ messages, now }: Props) {
  if (messages.length === 0) {
    return (
      <p className="mt-8 border border-line bg-ground p-5 font-mono text-[12px] text-ink-faint sm:p-7">
        No messages yet.
      </p>
    );
  }

  return (
    <ol aria-label="Messages, newest first" className="mt-8 grid grid-cols-1 gap-px border border-line bg-line">
      {messages.map((message) => (
        <li
          key={message.id}
          id={`m-${message.id}`}
          // Unread items sit one surface up, the same lift the sheet uses for title blocks.
          className={`scroll-mt-6 p-5 sm:p-7 ${message.status === "new" ? "bg-surface" : "bg-ground"}`}
        >
          <MessageCard message={message} now={now} />
        </li>
      ))}
    </ol>
  );
}
