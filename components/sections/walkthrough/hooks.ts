"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

// Matches the 2.5rem edge fade on .walk-tabs in client-work.css.
export const TAB_EDGE_FADE_PX = 40;

/*
  Marks a horizontal scroller with data-fade-start / data-fade-end while content is hidden
  past that edge, so CSS can fade the edge as a "there is more" cue. Written to the DOM
  directly: scrolling should never re-render React.
*/
export function useEdgeFade(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      const hidden = node.scrollWidth - node.clientWidth;
      node.toggleAttribute("data-fade-start", node.scrollLeft > 1);
      node.toggleAttribute("data-fade-end", hidden - node.scrollLeft > 1);
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    // Tabs change width when the webfont lands, which moves scrollWidth without resizing the list.
    const observer = new ResizeObserver(update);
    observer.observe(node);
    for (const child of Array.from(node.children)) observer.observe(child);
    return () => {
      node.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [ref]);
}

/*
  Two questions about the walkthrough's position, answered with one hook:
  - `inView`: at least 30% on screen right now, which is when the tour plays;
  - `near`: within a screen or so, ever. Latches, so a visitor who never scrolls here
    downloads no poster and no video metadata.
*/
export function useSectionVisibility(ref: RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const viewing = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), {
      threshold: 0.3,
    });
    const approaching = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setNear(true);
        approaching.disconnect();
      },
      { rootMargin: "600px 0px" },
    );
    viewing.observe(node);
    approaching.observe(node);
    return () => {
      viewing.disconnect();
      approaching.disconnect();
    };
  }, [ref]);

  return { inView, near };
}

/** False while the tab is in the background: a tour nobody sees should not advance. */
export function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

type NetworkInformation = EventTarget & { saveData?: boolean };

const connectionOf = () => (navigator as Navigator & { connection?: NetworkInformation }).connection;

const subscribeToConnection = (onChange: () => void) => {
  const connection = connectionOf();
  connection?.addEventListener("change", onChange);
  return () => connection?.removeEventListener("change", onChange);
};

/** The visitor asked their browser to save data: nothing should start downloading by itself. */
export function useDataSaver() {
  return useSyncExternalStore(
    subscribeToConnection,
    () => connectionOf()?.saveData === true,
    () => false,
  );
}
