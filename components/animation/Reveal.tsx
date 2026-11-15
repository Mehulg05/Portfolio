"use client";

import { createElement } from "react";

// One observer for the whole page rather than one per element.
let sharedObserver: IntersectionObserver | null = null;

function getObserver() {
  if (typeof window === "undefined") return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            sharedObserver?.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
  }
  return sharedObserver;
}

type Props = {
  children: React.ReactNode;
  as?: "div" | "li" | "article" | "header" | "p" | "ol" | "ul" | "dl";
  className?: string;
  delay?: number;
};

// A callback ref with cleanup (React 19) instead of useRef + useEffect: the element is
// observed when it mounts and unobserved when it unmounts.
function observeReveal(node: HTMLElement | null) {
  if (!node) return;

  // No js-motion class means reduced motion or no JS gate — content is already visible.
  if (!document.documentElement.classList.contains("js-motion")) return;

  const observer = getObserver();
  observer?.observe(node);
  return () => observer?.unobserve(node);
}

export function Reveal({ children, as = "div", className, delay = 0 }: Props) {
  return createElement(
    as,
    {
      ref: observeReveal,
      className: className ? `reveal ${className}` : "reveal",
      style: delay ? { transitionDelay: `${delay}ms` } : undefined,
    },
    children,
  );
}
