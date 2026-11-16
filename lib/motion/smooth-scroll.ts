/*
  Wheel smoothing for desktop mice, written against the real scroll position.

  Only the wheel is touched. Keyboard, scrollbar, touch, find-in-page and anchor jumps all
  stay native, and the loop notices them and lets go. Every frame writes window.scrollY,
  so sticky pinning and lib/motion/scroll-progress.ts see an ordinary scroll: there is no
  transformed wrapper to keep in sync.

  Off by default (see SMOOTH_WHEEL in components/animation/SmoothScroll.tsx). Browsers
  already ease the wheel, and a trackpad brings its own momentum; a second lerp on top of
  that reads as lag.
*/

export type SmoothScrollController = {
  stop: () => void;
  start: () => void;
  destroy: () => void;
};

/* Fraction of the remaining distance closed per 1/60 s. Higher is snappier. */
const EASE_PER_FRAME = 0.14;
/* Closer than this and the loop snaps to the target and sleeps. */
const SETTLE_PX = 0.5;
/* A scroll position further than this from what the loop wrote came from someone else. */
const FOREIGN_PX = 2;
const LINE_PX = 16;

const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const wheelDeltaPx = (event: WheelEvent) => {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * LINE_PX;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
  return event.deltaY;
};

/* True when an element between the target and the page would scroll this wheel itself. */
const nestedScrollerTakes = (target: EventTarget | null, deltaY: number) => {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.body && node !== document.documentElement) {
    const { overflowY } = getComputedStyle(node);
    const scrollable = (overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight;
    if (scrollable) {
      const atTop = node.scrollTop <= 0;
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
      if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return true;
    }
    node = node.parentElement;
  }
  return false;
};

export const createSmoothScroll = (): SmoothScrollController => {
  let target = window.scrollY;
  let current = target;
  let frame = 0;
  let lastTime = 0;
  let paused = false;

  const sleep = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const resync = () => {
    sleep();
    target = current = window.scrollY;
  };

  const step = (time: number) => {
    // Something else moved the page mid-glide (keyboard, scrollbar, an anchor): yield to it.
    if (Math.abs(window.scrollY - current) > FOREIGN_PX) {
      resync();
      return;
    }
    const elapsed = lastTime ? Math.min(time - lastTime, 64) : 16.7;
    lastTime = time;
    const ease = 1 - Math.pow(1 - EASE_PER_FRAME, elapsed / 16.7);
    current += (target - current) * ease;
    if (Math.abs(target - current) < SETTLE_PX) current = target;

    // "instant" overrides the stylesheet's scroll-behavior: smooth for this write only.
    // The browser rounds to device pixels; FOREIGN_PX absorbs that difference.
    window.scrollTo({ top: current, behavior: "instant" });
    frame = current === target ? 0 : requestAnimationFrame(step);
  };

  const onWheel = (event: WheelEvent) => {
    if (paused || event.defaultPrevented || event.ctrlKey) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (nestedScrollerTakes(event.target, event.deltaY)) return;

    event.preventDefault();
    if (!frame) {
      target = current = window.scrollY;
      lastTime = 0;
    }
    target = clamp(target + wheelDeltaPx(event), 0, maxScroll());
    if (!frame) frame = requestAnimationFrame(step);
  };

  // Native scrolls while idle move the baseline the next wheel starts from.
  const onScroll = () => {
    if (!frame) target = current = window.scrollY;
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", onScroll, { passive: true });

  return {
    stop: () => {
      paused = true;
      resync();
    },
    start: () => {
      paused = false;
      resync();
    },
    destroy: () => {
      sleep();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
    },
  };
};
