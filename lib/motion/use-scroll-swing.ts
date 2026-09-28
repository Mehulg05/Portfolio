"use client";

import { useEffect, type RefObject } from "react";
import { observeScrollProgress } from "@/lib/motion/scroll-progress";

/*
  Makes an element hang: scrolling nudges it into a small pendulum swing that settles
  back to rest. Rides the shared scroll listener for the kick, then runs its own rAF
  loop only while the element is still moving.

  The pointer can also grab it. While held, the element follows the pointer's angle
  around the pivot (`pivotAbove` px above the element's top edge, matching its CSS
  transform-origin); on release it carries the last velocity into the same spring, so a
  flick swings and a slow drag just lets go.
*/
export function useScrollSwing(
  ref: RefObject<HTMLElement | null>,
  {
    maxDegrees = 6,
    kick = 0.08,
    stiffness = 0.06,
    damping = 0.86,
    pivotAbove = 112,
    maxDrag = 42,
  } = {},
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let angle = 0;
    let velocity = 0;
    let lastScrollY = window.scrollY;
    let frame = 0;
    let dragging = false;
    let pivot = { x: 0, y: 0 };

    const paint = () => {
      element.style.transform = `rotate(${angle.toFixed(3)}deg)`;
    };

    const step = () => {
      frame = 0;
      if (dragging) return;
      // Spring towards rest, damped.
      velocity += -angle * stiffness;
      velocity *= damping;
      angle += velocity;

      if (Math.abs(angle) < 0.02 && Math.abs(velocity) < 0.02) {
        angle = 0;
        velocity = 0;
        element.style.transform = "";
        return;
      }
      paint();
      frame = requestAnimationFrame(step);
    };

    const stop = observeScrollProgress(element, () => {
      const delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      if (dragging) return;
      // Scrolling down swings the card back (positive), up swings it forward.
      const push = Math.max(-maxDegrees, Math.min(maxDegrees, delta * kick));
      velocity += push * 0.5;
      if (!frame) frame = requestAnimationFrame(step);
    });

    /*
      The pivot is measured from the untransformed box: offsetLeft/offsetTop are laid-out
      positions and ignore the rotation, so grabbing a card mid-swing still finds the
      same point the CSS rotates around.
    */
    const angleTo = (event: PointerEvent) => {
      const dx = event.clientX - pivot.x;
      const dy = event.clientY - pivot.y;
      const degrees = (Math.atan2(dx, dy) * 180) / Math.PI;
      return Math.max(-maxDrag, Math.min(maxDrag, degrees));
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const parent = element.offsetParent as HTMLElement | null;
      const base = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };
      pivot = {
        x: base.left + element.offsetLeft + element.offsetWidth / 2,
        y: base.top + element.offsetTop - pivotAbove,
      };
      dragging = true;
      velocity = 0;
      element.classList.add("is-dragging");
      element.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const next = angleTo(event);
      velocity = next - angle;
      angle = next;
      paint();
    };

    const onUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      element.classList.remove("is-dragging");
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      if (!frame) frame = requestAnimationFrame(step);
    };

    element.classList.add("idcard-grab");
    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onUp);

    return () => {
      stop();
      if (frame) cancelAnimationFrame(frame);
      element.classList.remove("idcard-grab", "is-dragging");
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onUp);
      element.style.transform = "";
    };
  }, [ref, maxDegrees, kick, stiffness, damping, pivotAbove, maxDrag]);
}
