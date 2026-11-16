"use client";

import { useEffect, useRef } from "react";

/*
  Every admin action is a full-page round trip, so focus falls back to <body> and a keyboard
  user loses their place. Rendered inside a `tabIndex={-1}` element, this moves focus to it
  once the page arrives (the notice after an archive or delete, say), which also makes
  screen readers read it. Without JavaScript the page simply loads as before.
*/
export function FocusParentOnMount() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    marker.current?.parentElement?.focus({ preventScroll: true });
  }, []);

  return <span ref={marker} hidden />;
}
