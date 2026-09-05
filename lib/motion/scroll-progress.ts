"use client";

/*
  One rAF-throttled scroll listener for every scrub on the page.
  Progress is 0 when the element's top reaches the viewport top and 1 when its
  bottom reaches the viewport bottom — i.e. the travel of a sticky section.
*/

type Callback = (progress: number) => void;

/*
  `readLine` switches the basis: progress then runs from the element's top crossing
  a line in the viewport to its bottom crossing the same line. Use it when the scrub
  drives something keyed to what the visitor is currently reading, rather than to a
  sticky element's travel.
*/
type Options = { readLine?: number };

type Subscription = { callback: Callback; options: Options };

const subscribers = new Map<HTMLElement, Set<Subscription>>();
let frame = 0;
let listening = false;

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function measure() {
  frame = 0;
  const viewport = window.innerHeight;

  for (const [element, subscriptions] of subscribers) {
    const rect = element.getBoundingClientRect();
    const travel = rect.height - viewport;

    const travelProgress =
      travel > 0
        ? clamp01(-rect.top / travel)
        : clamp01((viewport - rect.top) / Math.max(viewport, 1));

    for (const { callback, options } of subscriptions) {
      if (options.readLine === undefined) {
        callback(travelProgress);
        continue;
      }
      const line = viewport * options.readLine;
      callback(clamp01((line - rect.top) / Math.max(rect.height, 1)));
    }
  }
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(measure);
}

function startListening() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
}

function stopListening() {
  if (!listening) return;
  listening = false;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
  if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}

export function observeScrollProgress(
  element: HTMLElement,
  callback: Callback,
  options: Options = {},
) {
  const subscription: Subscription = { callback, options };
  const existing = subscribers.get(element);
  if (existing) existing.add(subscription);
  else subscribers.set(element, new Set([subscription]));

  startListening();
  schedule();

  return () => {
    const subscriptions = subscribers.get(element);
    if (!subscriptions) return;
    subscriptions.delete(subscription);
    if (subscriptions.size === 0) subscribers.delete(element);
    if (subscribers.size === 0) stopListening();
  };
}
