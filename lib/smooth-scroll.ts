import type { SmoothScrollController } from "@/lib/motion/smooth-scroll";

/*
  The wheel smoother is created inside <SmoothScroll /> and never rendered into the tree,
  so there is no context to reach it through. A modal has to pause it — otherwise the
  wheel keeps driving the page behind the dialog — so the instance is parked here.

  Null whenever smoothing is off (the default, reduced motion, touch, narrow screens), and
  every accessor is a no-op then: the CSS scroll lock covers those paths.
*/
let instance: SmoothScrollController | null = null;

export function registerSmoothScroll(next: SmoothScrollController | null) {
  instance = next;
}

export function pauseSmoothScroll() {
  instance?.stop();
}

export function resumeSmoothScroll() {
  instance?.start();
}
