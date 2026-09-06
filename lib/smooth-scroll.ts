import type Lenis from "lenis";

/*
  Lenis is created inside <SmoothScroll /> and never rendered into the tree, so there is
  no context to reach it through. A modal has to pause it — otherwise the wheel keeps
  driving the page behind the dialog — so the instance is parked here instead.

  Null whenever smooth scroll is off (reduced motion, or before the chunk lands), and
  every accessor is a no-op in that case: the CSS scroll lock covers those paths.
*/
let instance: Lenis | null = null;

export function registerSmoothScroll(next: Lenis | null) {
  instance = next;
}

export function pauseSmoothScroll() {
  instance?.stop();
}

export function resumeSmoothScroll() {
  instance?.start();
}
