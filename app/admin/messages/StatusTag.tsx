import type { MessageStatus } from "@/lib/db/messages";

const tones: Record<MessageStatus, string> = {
  new: "border-accent/45 text-accent",
  read: "border-line text-ink-faint",
  replied: "border-line-bright text-ink-dim",
  archived: "border-line text-ink-faint",
};

export function StatusTag({ status }: { status: MessageStatus }) {
  return (
    <span
      className={`inline-block border px-1.5 py-0.5 font-mono text-[10px] leading-none uppercase tracking-[0.1em] ${tones[status]}`}
    >
      <span className="sr-only">Status: </span>
      {status}
    </span>
  );
}

/** The row marker: a filled square reads as "unread" at a glance, a hollow one as handled. */
export function StatusDot({ status }: { status: MessageStatus }) {
  const tone = status === "new" ? "border-accent bg-accent" : "border-line-bright bg-transparent";
  return <span aria-hidden="true" className={`block size-1.5 border ${tone}`} />;
}
