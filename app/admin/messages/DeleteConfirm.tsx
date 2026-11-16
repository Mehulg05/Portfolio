/*
  The confirm step is a native <details> disclosure holding the real destructive button, so
  it needs no JavaScript and cannot be skipped by a stray click: the first press only
  reveals the second. With JS, Esc closes it (TriageKeys).
*/
export function DeleteConfirm({ id, name, returnTo }: { id: string; name: string; returnTo: string }) {
  return (
    <details data-confirm className="group open:basis-full">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center border border-line-bright px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim outline-accent select-none hover:border-redline hover:text-redline focus-visible:outline focus-visible:outline-offset-2 sm:min-h-10 [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">Delete</span>
        <span className="hidden group-open:inline">Cancel</span>
      </summary>
      <div className="mt-3 flex flex-col gap-3 border border-redline/45 bg-ground p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-ink-dim">
          Delete the message from <span className="break-words text-ink">{name}</span> for good? There is no undo.
        </p>
        <form method="post" action={`/api/admin/messages/${id}`} className="shrink-0">
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="return" value={returnTo} />
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center border border-redline bg-redline px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ground hover:border-ink hover:bg-ink sm:min-h-10 sm:w-auto"
          >
            Delete permanently
          </button>
        </form>
      </div>
    </details>
  );
}
