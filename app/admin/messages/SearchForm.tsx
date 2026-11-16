import Form from "next/form";
import Link from "next/link";
import { messagesHref, type MessagesState } from "@/app/admin/messages/url";
import { MAX_SEARCH_LENGTH } from "@/lib/db/messages";

/*
  A GET form, so searching is a plain navigation to /messages?q=... with or without
  JavaScript (next/form turns it into a client navigation when JS is there). Keyed by the
  term so "Clear" also empties the field after a client navigation.
*/
export function SearchForm({ state }: { state: MessagesState }) {
  return (
    <div className="px-4 py-3">
      <Form key={state.q} action="/messages" role="search" className="flex gap-px border border-line bg-line">
        {state.status !== "inbox" && <input type="hidden" name="status" value={state.status} />}
        <label htmlFor="messages-q" className="sr-only">
          Search name, email and message
        </label>
        <input
          id="messages-q"
          name="q"
          type="search"
          defaultValue={state.q}
          maxLength={MAX_SEARCH_LENGTH}
          placeholder="Search messages"
          autoComplete="off"
          spellCheck={false}
          data-search-input
          // 16px below lg so iOS does not zoom the page when the field takes focus.
          className="min-w-0 flex-1 bg-ground px-3 py-2 font-mono text-[16px] text-ink outline-accent placeholder:text-ink-faint focus-visible:outline focus-visible:-outline-offset-1 lg:text-[12px]"
        />
        <button
          type="submit"
          className="bg-ground px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim outline-accent hover:text-accent focus-visible:outline focus-visible:-outline-offset-1"
        >
          Search
        </button>
      </Form>
      {state.q && (
        <p className="mt-2 flex min-w-0 items-baseline gap-2 font-mono text-[11px] text-ink-faint">
          <span className="min-w-0 truncate">
            Matching <span className="text-ink-dim">&ldquo;{state.q}&rdquo;</span>
          </span>
          <Link
            href={messagesHref({ status: state.status })}
            className="shrink-0 uppercase tracking-[0.14em] text-[10px] text-accent hover:text-ink"
          >
            Clear
          </Link>
        </p>
      )}
    </div>
  );
}
