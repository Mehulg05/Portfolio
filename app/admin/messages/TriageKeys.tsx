"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/*
  Keyboard triage layered on top of a page that already works with links and forms. It reads
  the server-rendered DOM (rows carry data-row-id, the reply link and archive form carry
  data-shortcut) instead of receiving the list as props, so the list stays a server
  component and this file ships only a key handler.

  Wide screens: J/K move the selection, and the detail pane follows (URL ?id= via
  router.replace, debounced so holding J does not fire a request per row).
  Narrow screens: J/K move focus through the list and Enter opens, because opening swaps
  the whole view.
*/

const WIDE_QUERY = "(min-width: 64rem)";
const NAV_DEBOUNCE_MS = 120;

const keys: [key: string, action: string][] = [
  ["J / K", "Next / previous message"],
  ["Enter", "Open the focused message"],
  ["R", "Reply by email"],
  ["E", "Archive or unarchive"],
  ["/", "Search"],
  ["Esc", "Close the delete confirmation"],
  ["?", "Toggle this list"],
];

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, textarea, select"))
  );
}

function rows() {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>("a[data-row-id]"));
}

function isShown(element: HTMLElement) {
  return element.getClientRects().length > 0;
}

const subscribeNever = () => () => {};

export function TriageKeys({ selectedId }: { selectedId: string | null }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // False during SSR and hydration, true after: the legend only appears once the keys work.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);

  // Keep the selected row in view on wide screens; on narrow ones the detail replaced the
  // list, so bring its top into view after a client navigation from deep in the list.
  useEffect(() => {
    if (!selectedId) return;
    if (window.matchMedia(WIDE_QUERY).matches) {
      document.querySelector(`a[data-row-id="${selectedId}"]`)?.scrollIntoView({ block: "nearest" });
      return;
    }
    const detail = document.getElementById("message-detail");
    if (detail && detail.getBoundingClientRect().top < 0) detail.scrollIntoView({ block: "start" });
  }, [selectedId]);

  useEffect(() => {
    function navigate(href: string, debounce: boolean) {
      if (navTimer.current) clearTimeout(navTimer.current);
      if (!debounce) return router.replace(href, { scroll: false });
      navTimer.current = setTimeout(() => router.replace(href, { scroll: false }), NAV_DEBOUNCE_MS);
    }

    function move(delta: number) {
      const list = rows();
      if (list.length === 0) return;
      const active = document.activeElement;
      let index = list.findIndex((row) => row === active);
      if (index === -1) index = list.findIndex((row) => row.getAttribute("aria-current") === "true");
      const nextIndex = index === -1 ? 0 : Math.min(Math.max(index + delta, 0), list.length - 1);
      if (nextIndex === index) return;

      const row = list[nextIndex];
      const href = row.getAttribute("href");
      if (!href) return;
      if (isShown(row)) {
        row.focus({ preventScroll: true });
        row.scrollIntoView({ block: "nearest" });
        if (window.matchMedia(WIDE_QUERY).matches) navigate(href, true);
      } else {
        // The list is hidden behind an open message (narrow screen): step to the neighbour.
        navigate(href, false);
      }
    }

    function openFocused(event: KeyboardEvent) {
      const active = document.activeElement;
      // A focused row is a link; the browser already follows it on Enter.
      if (active instanceof HTMLAnchorElement && active.dataset.rowId) return;
      if (active && active !== document.body) return;
      const row = rows().find((r) => r.getAttribute("aria-current") === "true" && isShown(r)) ?? rows().find(isShown);
      const href = row?.getAttribute("href");
      if (!href) return;
      event.preventDefault();
      router.push(href, { scroll: false });
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Escape") {
        document.querySelectorAll<HTMLDetailsElement>("details[data-confirm][open]").forEach((d) => {
          d.open = false;
          d.querySelector("summary")?.focus();
        });
        return;
      }
      if (isTyping(event.target)) return;

      switch (event.key) {
        case "j":
        case "k":
          event.preventDefault();
          move(event.key === "j" ? 1 : -1);
          break;
        case "Enter":
          openFocused(event);
          break;
        case "r":
          document.querySelector<HTMLAnchorElement>("a[data-shortcut='reply']")?.click();
          break;
        case "e":
          document.querySelector<HTMLFormElement>("form[data-shortcut='archive']")?.requestSubmit();
          break;
        case "/": {
          const search = document.querySelector<HTMLInputElement>("input[data-search-input]");
          if (search && isShown(search)) {
            event.preventDefault();
            search.focus();
            search.select();
          }
          break;
        }
        case "?":
          setExpanded((open) => !open);
          break;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (navTimer.current) clearTimeout(navTimer.current);
    };
  }, [router]);

  if (!hydrated) return null;

  return (
    <div className="hidden border-t border-line bg-ground px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint lg:block">
      {expanded ? (
        <dl aria-label="Keyboard shortcuts" className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          {keys.map(([key, action]) => (
            <div key={key} className="contents">
              <dt className="text-ink-dim">{key}</dt>
              <dd className="normal-case tracking-normal text-[11px]">{action}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p>
          <span className="text-ink-dim">J/K</span> move · <span className="text-ink-dim">Enter</span> open ·{" "}
          <span className="text-ink-dim">R</span> reply · <span className="text-ink-dim">E</span> archive ·{" "}
          <span className="text-ink-dim">?</span>
        </p>
      )}
    </div>
  );
}
