import { unarchivedStatus } from "@/app/admin/messages/MessageActions";
import type { Notice as NoticeKind } from "@/app/admin/messages/url";
import type { Message } from "@/lib/db/messages";

type Props = {
  notice: NoticeKind;
  /** The archived message, when it can still be restored. */
  undo: Message | null;
  /** Where Undo lands: the current view with the restored message open. */
  undoReturn: string;
};

const copy: Record<NoticeKind, string> = {
  archived: "Archived.",
  deleted: "Message deleted.",
  unread: "Marked unread.",
};

export function Notice({ notice, undo, undoReturn }: Props) {
  const canUndo = notice === "archived" && undo?.status === "archived";

  return (
    <div
      role="status"
      className="flex min-h-11 items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2 font-mono text-[11px] text-ink-dim"
    >
      <p className="min-w-0 truncate">
        {canUndo ? (
          <>
            Archived <span className="text-ink">{undo.name}</span>.
          </>
        ) : (
          copy[notice]
        )}
      </p>
      {canUndo && (
        <form method="post" action={`/api/admin/messages/${undo.id}`} className="shrink-0">
          <input type="hidden" name="status" value={unarchivedStatus(undo)} />
          <input type="hidden" name="return" value={undoReturn} />
          <button
            type="submit"
            className="min-h-9 px-2 text-[10px] uppercase tracking-[0.14em] text-accent outline-accent hover:text-ink focus-visible:outline"
          >
            Undo
          </button>
        </form>
      )}
    </div>
  );
}
