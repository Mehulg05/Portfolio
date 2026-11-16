"use client";

import { createElement } from "react";
import { watchReveal } from "@/lib/motion/reveal";

type Props = {
  children: React.ReactNode;
  as?: "div" | "li" | "article" | "header" | "p" | "ol" | "ul" | "dl";
  className?: string;
  delay?: number;
};

// A callback ref with cleanup (React 19): watched when it mounts, released when it unmounts.
const observeReveal = (node: HTMLElement | null) => {
  if (!node) return;
  // No js-motion class means reduced motion or no JS: the content is already visible.
  if (!document.documentElement.classList.contains("js-motion")) return;
  return watchReveal(node);
};

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
