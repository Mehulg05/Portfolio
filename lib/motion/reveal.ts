/*
  Reveal-on-scroll, one engine for the whole page.

  An element is revealed once its top has come above the reading edge: in view now, or
  already scrolled past. "Scrolled past" matters, because a jump from the nav or a deep
  link (#education) skips over most of the page, and nothing above the visitor should be
  left blank when they scroll back up.

  Three triggers, because no single one covers every path:
  - an IntersectionObserver for ordinary reading;
  - a sweep on mount, so whatever is on screen at first layout shows without a scroll;
  - a sweep once scrolling settles and on hashchange / pageshow / load, which catches the
    jumps an observer never reports (an element skipped over entirely changes no
    intersection state, and an instant jump can land before the observer's first frame).
*/

/* Fraction of the viewport, from the top, that counts as "reached". */
const READING_EDGE = 0.92;
const SETTLE_MS = 120;

const pending = new Set<Element>();
let observer: IntersectionObserver | null = null;
let sweepQueued = false;
let settleTimer = 0;
let listening = false;

const reveal = (element: Element) => {
  element.classList.add("is-revealed");
  pending.delete(element);
  observer?.unobserve(element);
  if (pending.size === 0) stopListening();
};

const isReached = (element: Element) =>
  element.getBoundingClientRect().top < window.innerHeight * READING_EDGE;

const sweep = () => {
  sweepQueued = false;
  // Read every rect first, then write, so the sweep costs one layout.
  const reached = [...pending].filter(isReached);
  reached.forEach(reveal);
};

/* Microtask, not rAF: it runs right after React's commit, before the first paint. */
const queueSweep = () => {
  if (sweepQueued) return;
  sweepQueued = true;
  queueMicrotask(sweep);
};

const onScroll = () => {
  window.clearTimeout(settleTimer);
  settleTimer = window.setTimeout(sweep, SETTLE_MS);
};

const PAGE_EVENTS = ["hashchange", "pageshow", "load", "resize"] as const;

const startListening = () => {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", onScroll, { passive: true });
  PAGE_EVENTS.forEach((type) => window.addEventListener(type, queueSweep));
};

const stopListening = () => {
  if (!listening) return;
  listening = false;
  window.clearTimeout(settleTimer);
  window.removeEventListener("scroll", onScroll);
  PAGE_EVENTS.forEach((type) => window.removeEventListener(type, queueSweep));
};

const getObserver = () => {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        // Above the viewport counts too: the element was jumped over on the way down.
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          reveal(entry.target);
        }
      }
    },
    { rootMargin: `0px 0px -${Math.round((1 - READING_EDGE) * 100)}% 0px`, threshold: 0 },
  );
  return observer;
};

/**
 * Watch an element until it has been reached, then add `is-revealed` to it once.
 * Returns the cleanup for when the element unmounts first.
 */
export const watchReveal = (element: Element) => {
  // Tells the failsafe in app/layout.tsx's head script that the engine is running.
  document.documentElement.setAttribute("data-reveal-ready", "");
  pending.add(element);
  getObserver().observe(element);
  startListening();
  queueSweep();

  return () => {
    pending.delete(element);
    observer?.unobserve(element);
    if (pending.size === 0) stopListening();
  };
};
