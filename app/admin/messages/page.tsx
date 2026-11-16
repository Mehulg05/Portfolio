import type { Metadata } from "next";
import { ListPane } from "@/app/admin/messages/ListPane";
import { MarkReadOnOpen } from "@/app/admin/messages/MarkReadOnOpen";
import { BackToList, MessageDetail } from "@/app/admin/messages/MessageDetail";
import { Notice } from "@/app/admin/messages/Notice";
import { type MessagesState, type MessagesUrl, messagesHref, parseMessagesParams } from "@/app/admin/messages/url";
import { hasAdminSession } from "@/lib/admin/auth";
import { errorClass } from "@/lib/admin/health";
import {
  type Message,
  type MessageCounts,
  type MessagePage,
  countByStatus,
  getMessage,
  listMessagesPage,
} from "@/lib/db/messages";

// Reads a cookie and live rows on every request; nothing here may be cached or prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Messages" };

const PAGE_SIZE = 50;
// The two panes hold at least this height at lg, so a short list or an empty detail still reads as a sheet.
const PANE_MIN_HEIGHT = "lg:min-h-[min(48rem,calc(100dvh-10rem))]";

type Loaded = {
  page: MessagePage;
  counts: MessageCounts;
  selected: Message | null;
  undo: Message | null;
};

async function load(url: MessagesUrl): Promise<Loaded | null> {
  try {
    const [page, counts, selected, undo] = await Promise.all([
      listMessagesPage({ status: url.status, q: url.q, cursor: url.cursor, limit: PAGE_SIZE }),
      countByStatus(url.q),
      url.id ? getMessage(url.id) : null,
      url.notice === "archived" && url.undo ? getMessage(url.undo) : null,
    ]);
    return { page, counts, selected, undo };
  } catch (error) {
    console.error("[messages] loading the page failed", errorClass(error));
    return null;
  }
}

/**
 * Where archive/unarchive should land. Either one drops the message out of the list being
 * looked at, so the selection moves to its neighbour (the next older one, else the one above)
 * and triage can carry on with E, E, E.
 */
function neighbourId(items: Message[], id: string) {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return id;
  return items[index + 1]?.id ?? items[index - 1]?.id ?? null;
}

function EmptyDetail({ text, backHref }: { text: string; backHref?: string }) {
  return (
    <div className={`flex flex-col ${PANE_MIN_HEIGHT}`}>
      {backHref && <BackToList href={backHref} />}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center lg:py-0">
        <span aria-hidden="true" className="tick-frame block h-10 w-16 border-x border-b border-line" />
        <p className="font-mono text-[12px] text-ink-faint">{text}</p>
      </div>
    </div>
  );
}

function DatabaseError() {
  return (
    <p role="alert" className="border border-redline/45 bg-ground p-5 font-mono text-[12px] text-redline sm:p-7">
      Could not reach the database. Check the server logs and reload.
    </p>
  );
}

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  if (!(await hasAdminSession())) return null;

  const url = parseMessagesParams(await searchParams);
  const data = await load(url);
  if (!data) return <DatabaseError />;

  const { page, counts, selected, undo } = data;
  const state: MessagesState = { status: url.status, q: url.q, cursor: url.cursor, id: url.id };
  const now = new Date();
  const listHref = messagesHref({ ...state, id: null });
  const returnTo = messagesHref(state);

  let detail;
  if (!url.id) {
    detail = <EmptyDetail text="Nothing selected. Pick a message, or press J." />;
  } else if (!selected) {
    detail = <EmptyDetail text="That message no longer exists." backHref={listHref} />;
  } else {
    detail = (
      <>
        <MessageDetail
          message={selected}
          now={now}
          backHref={`${listHref}#m-${selected.id}`}
          returnTo={returnTo}
          advanceTo={messagesHref({ ...state, id: neighbourId(page.items, selected.id) })}
        />
        {/* Not right after "Mark unread", or it would undo the click a second later. */}
        {selected.status === "new" && url.notice !== "unread" && <MarkReadOnOpen id={selected.id} />}
      </>
    );
  }

  return (
    <div className="border border-line">
      {url.notice && (
        <Notice notice={url.notice} undo={undo} undoReturn={messagesHref({ ...state, id: url.undo })} />
      )}
      <div className={`grid grid-cols-1 gap-px bg-line lg:grid-cols-[380px_minmax(0,1fr)] ${PANE_MIN_HEIGHT}`}>
        {/* Below lg one pane at a time: the list, or the open message. */}
        <div className={`min-w-0 ${url.id ? "hidden lg:flex" : "flex"} flex-col bg-ground`}>
          <ListPane state={state} page={page} counts={counts} now={now} />
        </div>
        <div id="message-detail" className={`min-w-0 scroll-mt-4 bg-ground ${url.id ? "block" : "hidden lg:block"}`}>
          {/* Sticky so the message stays in view while the list scrolls past it. */}
          <div className="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">{detail}</div>
        </div>
      </div>
    </div>
  );
}
