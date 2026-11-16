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
const EASE_PER_FRAME = 0.18;
const FRAME_MS = 1000 / 60;
const MAX_STEP_MS = 64;
/* Closer than this and the loop snaps to the target and sleeps. */
const SETTLE_PX = 0.5;
/* A scroll position further than this from what the loop wrote came from someone else. */
const FOREIGN_PX = 2;
const LINE_PX = 16;

/* clientHeight, not innerHeight: a horizontal scrollbar is not part of the scrollport. */
const maxScroll = () =>
  Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/* Writes land on the device-pixel grid, which is coarser than 1 CSS px when zoomed out. */
const foreignPx = () => Math.max(FOREIGN_PX, 1 / window.devicePixelRatio);

/* deltaY before deltaMode on purpose: Firefox then reports pixels at its native notch
   size. The line and page branches are a fallback for engines that still send them. */
const wheelDeltaPx = (event: WheelEvent) => {
  const delta = event.deltaY;
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return delta * LINE_PX;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return delta * document.documentElement.clientHeight;
  return delta;
};

/* True when an element between the target and the page would take this wheel itself. */
const nestedScrollerTakes = (target: EventTarget | null, deltaY: number) => {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.body && node !== document.documentElement) {
    if (node.scrollHeight > node.clientHeight) {
      const { overflowY, overscrollBehaviorY } = getComputedStyle(node);
      if (overflowY === "auto" || overflowY === "scroll") {
        const atTop = node.scrollTop <= 0;
        const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
        if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return true;
        // At its edge it hands the wheel to the page, unless it contains its overscroll.
        if (overscrollBehaviorY !== "auto") return true;
      }
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
  /*
    A mouse wheel moves one axis per event; a trackpad or Magic Mouse often reports both.
    The first such event turns smoothing off for the session, since those devices bring OS
    momentum. A perfectly vertical first swipe still gets smoothed, so this limits the
    damage rather than detecting the device.
  */
  let inertialDevice = false;

  const sleep = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const resync = () => {
    sleep();
    target = current = window.scrollY;
  };

  const step = (time: number) => {
    // Something else moved the page mid-glide (scrollbar, find-in-page, focus): yield to it.
    if (Math.abs(window.scrollY - current) > foreignPx()) {
      resync();
      return;
    }
    const elapsed = lastTime ? Math.min(time - lastTime, MAX_STEP_MS) : FRAME_MS;
    lastTime = time;
    // The document can shrink mid-glide (a disclosure closing); never aim past its new end.
    target = Math.min(target, maxScroll());
    const ease = 1 - Math.pow(1 - EASE_PER_FRAME, elapsed / FRAME_MS);
    current += (target - current) * ease;
    if (Math.abs(target - current) < SETTLE_PX) current = target;

    // "instant" overrides the stylesheet's scroll-behavior: smooth for this write only.
    window.scrollTo({ top: current, behavior: "instant" });
    frame = current === target ? 0 : requestAnimationFrame(step);
  };

  const onWheel = (event: WheelEvent) => {
    if (paused || inertialDevice || event.defaultPrevented) return;
    // A modal is open (ContactDialog sets this): the page behind it must not move, even
    // if the controller was created after the dialog paused nothing.
    if (document.documentElement.hasAttribute("data-thread-open")) return;
    // Zoom, pinch (sent as ctrl+wheel) and shift's sideways scroll belong to the browser.
    if (event.ctrlKey || event.shiftKey) return;
    if (event.deltaX !== 0 && event.deltaY !== 0) {
      inertialDevice = true;
      resync();
      return;
    }
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (nestedScrollerTakes(event.target, event.deltaY)) return;

    if (!frame) {
      target = current = window.scrollY;
      lastTime = 0;
    }
    const next = clamp(target + wheelDeltaPx(event), 0, maxScroll());
    // Already at an edge: leave the overscroll bounce to the browser.
    if (next === target && !frame) return;

    event.preventDefault();
    target = next;
    if (!frame) frame = requestAnimationFrame(step);
  };

  // Keys and pointers start scrolls of their own (an anchor, a keyboard step) whose first
  // smooth frames move less than foreignPx, so the next write would cancel them.
  const release = () => {
    if (frame) resync();
  };

  // Native scrolls while idle move the baseline the next wheel starts from.
  const onScroll = () => {
    if (!frame) target = current = window.scrollY;
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("keydown", release, { capture: true, passive: true });
  window.addEventListener("pointerdown", release, { capture: true, passive: true });

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
      window.removeEventListener("keydown", release, { capture: true });
      window.removeEventListener("pointerdown", release, { capture: true });
    },
  };
};
