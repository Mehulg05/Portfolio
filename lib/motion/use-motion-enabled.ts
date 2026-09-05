"use client";

import { useEffect, useState } from "react";

/*
  Scrubbed sections only run on a large viewport with motion allowed.
  Starts false so the server render and the first client render match, and so the
  static Phase 1 presentation is always what loads first.
*/
export function useMotionEnabled(minWidth = 1024) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia(`(min-width: ${minWidth}px)`);

    const update = () => setEnabled(!reduced.matches && wide.matches);
    update();

    reduced.addEventListener("change", update);
    wide.addEventListener("change", update);

    return () => {
      reduced.removeEventListener("change", update);
      wide.removeEventListener("change", update);
    };
  }, [minWidth]);

  return enabled;
}
