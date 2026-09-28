"use client";

import { useEffect, type RefObject } from "react";
import { observeScrollProgress } from "@/lib/motion/scroll-progress";

/*
  A card held to a board by one pin. It hangs at `rest` degrees and swings about the
  pin (`pivotY` px below its top edge, matching its CSS transform-origin) as a damped
  spring: brushing the pointer across it nudges it, scrolling jolts it, and it can be
  taken by the corner and dragged round the pin, then let go with whatever speed the
  hand had. Runs its own frame loop only while it is moving.

  Desktop pointers only (hover + fine pointer, js-motion present). Anywhere else the
  card just keeps its CSS tilt.
*/
export function usePinSwing(
  ref: RefObject<HTMLElement | null>,
  { rest = 0, pivotY = 8, maxSwing = 55, kick = 1 } = {},
) {
  useEffect(() => {
    const card = ref.current;
    if (!card) return;
    const root = document.documentElement;
    if (!root.classList.contains("js-motion")) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let angle = rest;
    let velocity = 0;
    let frame = 0;
    let dragging = false;
    let pivot = { x: 0, y: 0 };
    let lastScrollY = window.scrollY;

    const paint = () => {
      card.style.setProperty("transform", `rotate(${angle.toFixed(3)}deg)`);
    };

    const step = () => {
      frame = 0;
      if (dragging) return;
      velocity += -(angle - rest) * 0.045;
      velocity *= 0.9;
      angle += velocity;
      if (Math.abs(angle - rest) < 0.02 && Math.abs(velocity) < 0.02) {
        angle = rest;
        velocity = 0;
        card.style.removeProperty("transform");
        card.classList.remove("is-swinging");
        return;
      }
      paint();
      frame = requestAnimationFrame(step);
    };

    const wake = () => {
      card.classList.add("is-swinging");
      if (!frame) frame = requestAnimationFrame(step);
    };

    // The pivot from the laid-out box, which ignores the rotation.
    const measurePivot = () => {
      const parent = card.offsetParent as HTMLElement | null;
      const base = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };
      pivot = {
        x: base.left + card.offsetLeft + card.offsetWidth / 2,
        y: base.top + card.offsetTop + pivotY,
      };
    };

    const angleTo = (event: PointerEvent) => {
      const degrees = (Math.atan2(event.clientX - pivot.x, event.clientY - pivot.y) * 180) / Math.PI;
      return Math.max(rest - maxSwing, Math.min(rest + maxSwing, degrees));
    };

    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const next = angleTo(event);
      velocity = next - angle;
      angle = next;
      paint();
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      card.classList.remove("is-dragging");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      wake();
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      measurePivot();
      dragging = true;
      velocity = 0;
      card.classList.add("is-dragging", "is-swinging");
      // No pointer capture: a plain click on the link inside must still be a click.
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    };

    // A hand brushing past: a small push in the direction it moved.
    const onBrush = (event: PointerEvent) => {
      if (dragging) return;
      const push = Math.max(-30, Math.min(30, event.movementX)) * 0.012 * kick;
      if (Math.abs(push) < 0.01) return;
      velocity += push;
      wake();
    };

    const onDragStart = (event: Event) => event.preventDefault();

    const stopScroll = observeScrollProgress(card, () => {
      const delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      if (dragging || delta === 0) return;
      velocity += Math.max(-30, Math.min(30, delta)) * 0.02 * kick;
      wake();
    });

    card.classList.add("pin-card-live");
    card.addEventListener("pointerdown", onDown);
    card.addEventListener("pointermove", onBrush);
    card.addEventListener("dragstart", onDragStart);

    return () => {
      stopScroll();
      if (frame) cancelAnimationFrame(frame);
      onUp();
      card.classList.remove("pin-card-live", "is-dragging", "is-swinging");
      card.removeEventListener("pointerdown", onDown);
      card.removeEventListener("pointermove", onBrush);
      card.removeEventListener("dragstart", onDragStart);
      card.style.removeProperty("transform");
    };
  }, [ref, rest, pivotY, maxSwing, kick]);
}
