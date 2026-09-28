"use client";

import { useEffect, type RefObject } from "react";
import { observeScrollProgress } from "@/lib/motion/scroll-progress";

/*
  A card on a thread.

  The lanyard is a chain of particles pinned to an anchor above the card; the card (in
  its holder, one rigid body: position, angle, mass, inertia) hangs from the chain's last
  link by its clip. Position-based dynamics: predict, satisfy the constraints a few times, derive the
  velocities from what moved. Gravity settles it straight. Scrolling jolts it. The
  pointer can take hold of the card anywhere: the card pivots under the finger, the
  thread goes slack when the card is lifted and pulls taut when it is dragged away —
  past the thread's reach the card stops following. Let go and it drops back onto the
  thread and swings out.

  Everything is in the container's own coordinate space (px, y down), so the sticky
  column can move with the page without the sim noticing. What gets painted each frame:
  the body (translate + rotate about its centre, plus a small rotateY twist from its
  sideways speed and a `--sheen` custom property that slides the gloss across the
  plastic), the strap as an SVG path with its two stitched edges, and the metal
  hardware at the strap's end, turned to follow the strap. The loop only runs while
  something is moving.
*/

type Vec = { x: number; y: number };

export type LanyardOptions = {
  /** Distance from the anchor to the card's top edge at rest. */
  length?: number;
  /** The hanging body's box (the holder with the card in it), px. The slot is at the top-centre. */
  width?: number;
  height?: number;
  /** Particles in the thread. More is smoother and a little costlier. */
  links?: number;
  /** px/s². Lower reads slower and heavier on screen. */
  gravity?: number;
};

const SUBSTEPS = 4;
const ITERATIONS = 8;
const MAX_FRAME = 1 / 30;

/** The hook meets the holder's slot this far below the holder's top edge. */
export const CLIP_DEPTH = 8;
/** Strap width, px; the stitched edges sit just inside it. */
export const STRAP_WIDTH = 12;
/** The strap disappears into the crimp this far before the hook's attachment point. */
const STRAP_END = 9;

export type LanyardParts = {
  /** The strap's centre line. */
  strap: RefObject<SVGPathElement | null>;
  /** Its two stitched edges. */
  edges: RefObject<SVGPathElement | null>;
  /** Crimp and ring, positioned at the strap's end. */
  hardware: RefObject<SVGGElement | null>;
};

export function useLanyard(
  container: RefObject<HTMLElement | null>,
  body: RefObject<HTMLElement | null>,
  parts: LanyardParts,
  { length = 112, width = 208, height = 312, links = 16, gravity = 3200 }: LanyardOptions = {},
) {
  useEffect(() => {
    const root = container.current;
    const card = body.current;
    const strap = parts.strap.current;
    const edges = parts.edges.current;
    const hardware = parts.hardware.current;
    if (!root || !card || !strap || !edges || !hardware) return;

    // --- bodies -----------------------------------------------------------------
    const anchor: Vec = { x: width / 2, y: -length };
    const rest: Vec = { x: width / 2, y: height / 2 };
    const clipLocal: Vec = { x: 0, y: -height / 2 + CLIP_DEPTH };

    const cardMass = 6;
    const cardInertia = (cardMass * (width * width + height * height)) / 12;
    const linkInverseMass = 1 / 0.12;

    const ropeLength = length + CLIP_DEPTH;
    const segment = ropeLength / (links - 1);
    const points: Vec[] = [];
    const before: Vec[] = [];
    const speeds: Vec[] = [];
    for (let i = 0; i < links; i++) {
      points.push({ x: anchor.x, y: anchor.y + segment * i });
      before.push({ x: anchor.x, y: anchor.y + segment * i });
      speeds.push({ x: 0, y: 0 });
    }

    const pos: Vec = { ...rest };
    const posBefore: Vec = { ...rest };
    const vel: Vec = { x: 0, y: 0 };
    let angle = 0;
    let angleBefore = 0;
    let spin = 0;
    /** Degrees of rotateY: the card turns a little on its axis as it moves sideways. */
    let twist = 0;

    // --- pointer ----------------------------------------------------------------
    let dragging = false;
    const grabLocal: Vec = { x: 0, y: 0 };
    const target: Vec = { x: 0, y: 0 };

    // --- loop -------------------------------------------------------------------
    let frame = 0;
    let lastTime = 0;
    let quietFrames = 0;

    const rotate = (v: Vec, a: number): Vec => {
      const c = Math.cos(a);
      const s = Math.sin(a);
      return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
    };

    /*
      Pull a point that is rigidly attached to the card (at `local`, in the card's own
      frame) towards `to`. `otherInverseMass` is the thing on the other end: 0 for the
      pointer, a link's inverse mass for the thread. `softness` lets a constraint give a
      little rather than snap. Returns the correction applied to the other end.
    */
    const pullBodyPoint = (
      local: Vec,
      to: Vec,
      otherInverseMass: number,
      softness: number,
    ): Vec => {
      const r = rotate(local, angle);
      const qx = pos.x + r.x;
      const qy = pos.y + r.y;
      let nx = qx - to.x;
      let ny = qy - to.y;
      const distance = Math.hypot(nx, ny);
      if (distance < 1e-6) return { x: 0, y: 0 };
      nx /= distance;
      ny /= distance;
      const cross = r.x * ny - r.y * nx;
      const bodyInverseMass = 1 / cardMass + (cross * cross) / cardInertia;
      const lambda = distance / (bodyInverseMass + otherInverseMass + softness);
      pos.x -= (lambda / cardMass) * nx;
      pos.y -= (lambda / cardMass) * ny;
      angle -= (lambda * cross) / cardInertia;
      return { x: lambda * otherInverseMass * nx, y: lambda * otherInverseMass * ny };
    };

    /*
      Keep two particles no further apart than `limit` (a string pulls but never
      pushes), or, with `apart`, no closer than it (so the thread cannot fold flat on
      itself). The first particle is the anchor and never moves.
    */
    const keep = (i: number, j: number, limit: number, apart: boolean) => {
      const a = points[i];
      const b = points[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 1e-6) return;
      if (apart ? distance >= limit : distance <= limit) return;
      dx /= distance;
      dy /= distance;
      const wa = i === 0 ? 0 : linkInverseMass;
      const wb = linkInverseMass;
      const correction = (distance - limit) / (wa + wb);
      a.x += wa * correction * dx;
      a.y += wa * correction * dy;
      b.x -= wb * correction * dx;
      b.y -= wb * correction * dy;
    };

    const solve = () => {
      // The last link is tied to the clip.
      const end = points[links - 1];
      const pull = pullBodyPoint(clipLocal, end, linkInverseMass, 0);
      end.x += pull.x;
      end.y += pull.y;

      // Then up the chain from the card, so its weight reaches the anchor in one sweep.
      for (let i = links - 2; i >= 0; i--) keep(i, i + 1, segment, false);
      for (let i = links - 3; i >= 0; i--) keep(i, i + 2, segment * 1.2, true);

      // The pointer holds the card where it was grabbed. Slightly soft, so pulling past
      // the thread's reach feels like the thread winning rather than the sim fighting.
      if (dragging) pullBodyPoint(grabLocal, target, 0, 0.04);
    };

    const substep = (dt: number) => {
      const linkDamping = Math.exp(-2.2 * dt);
      const bodyDamping = Math.exp(-(dragging ? 6 : 0.9) * dt);
      const spinDamping = Math.exp(-(dragging ? 6 : 1.4) * dt);

      for (let i = 1; i < links; i++) {
        const p = points[i];
        const v = speeds[i];
        v.y += gravity * dt;
        v.x *= linkDamping;
        v.y *= linkDamping;
        before[i].x = p.x;
        before[i].y = p.y;
        p.x += v.x * dt;
        p.y += v.y * dt;
      }

      vel.y += gravity * dt;
      vel.x *= bodyDamping;
      vel.y *= bodyDamping;
      spin *= spinDamping;
      posBefore.x = pos.x;
      posBefore.y = pos.y;
      angleBefore = angle;
      pos.x += vel.x * dt;
      pos.y += vel.y * dt;
      angle += spin * dt;

      for (let k = 0; k < ITERATIONS; k++) solve();

      for (let i = 1; i < links; i++) {
        speeds[i].x = (points[i].x - before[i].x) / dt;
        speeds[i].y = (points[i].y - before[i].y) / dt;
      }
      vel.x = (pos.x - posBefore.x) / dt;
      vel.y = (pos.y - posBefore.y) / dt;
      spin = (angle - angleBefore) / dt;
    };

    /** A smooth curve through the points: quadratic pieces meeting at midpoints. */
    const curve = (pts: Vec[]) => {
      let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const p = pts[i];
        const q = pts[i + 1];
        d += ` Q${p.x.toFixed(1)} ${p.y.toFixed(1)} ${((p.x + q.x) / 2).toFixed(1)} ${((p.y + q.y) / 2).toFixed(1)}`;
      }
      const end = pts[pts.length - 1];
      return d + ` L${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
    };

    const paint = () => {
      // Gloss slides across the plastic as the card tilts and turns; 50% is straight on.
      const sheen = Math.max(0, Math.min(100, 50 + angle * 90 + twist * 1.2));
      card.style.setProperty("--sheen", `${sheen.toFixed(1)}%`);
      card.style.setProperty(
        "transform",
        `translate(${(pos.x - rest.x).toFixed(2)}px, ${(pos.y - rest.y).toFixed(2)}px) rotate(${angle.toFixed(4)}rad) rotateY(${twist.toFixed(2)}deg)`,
      );

      // The strap runs to just inside the crimp, not all the way to the hook.
      const end = points[links - 1];
      const near = points[links - 2];
      let tx = end.x - near.x;
      let ty = end.y - near.y;
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const centre = points.slice(0, links - 1);
      centre.push({ x: end.x - tx * STRAP_END, y: end.y - ty * STRAP_END });
      strap.setAttribute("d", curve(centre));

      // Edges: offset the centre line along its normal, both sides.
      const half = STRAP_WIDTH / 2 - 1.5;
      const left: Vec[] = [];
      const right: Vec[] = [];
      for (let i = 0; i < centre.length; i++) {
        const a = centre[Math.max(0, i - 1)];
        const b = centre[Math.min(centre.length - 1, i + 1)];
        let nx = -(b.y - a.y);
        let ny = b.x - a.x;
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl;
        ny /= nl;
        left.push({ x: centre[i].x + nx * half, y: centre[i].y + ny * half });
        right.push({ x: centre[i].x - nx * half, y: centre[i].y - ny * half });
      }
      edges.setAttribute("d", `${curve(left)} ${curve(right)}`);

      // Hardware sits at the hook point, its local +y pointing along the strap.
      const heading = (Math.atan2(-tx, ty) * 180) / Math.PI;
      hardware.setAttribute(
        "transform",
        `translate(${end.x.toFixed(1)} ${end.y.toFixed(1)}) rotate(${heading.toFixed(1)})`,
      );
    };

    const isQuiet = () => {
      if (dragging) return false;
      if (Math.hypot(vel.x, vel.y) > 3 || Math.abs(spin) > 0.01 || Math.abs(twist) > 0.3) return false;
      for (let i = 1; i < links; i++) {
        if (Math.hypot(speeds[i].x, speeds[i].y) > 3) return false;
      }
      return true;
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(MAX_FRAME, lastTime ? (now - lastTime) / 1000 : 1 / 60);
      lastTime = now;

      const h = dt / SUBSTEPS;
      for (let s = 0; s < SUBSTEPS; s++) substep(h);

      const twistTarget =
        Math.max(-14, Math.min(14, vel.x * 0.03)) + Math.max(-8, Math.min(8, spin * 5));
      twist += (twistTarget - twist) * 0.12;

      quietFrames = isQuiet() ? quietFrames + 1 : 0;
      if (quietFrames > 30) {
        twist = 0;
        paint();
        lastTime = 0;
        return;
      }
      paint();
      frame = requestAnimationFrame(tick);
    };

    const wake = () => {
      quietFrames = 0;
      if (!frame) {
        lastTime = 0;
        frame = requestAnimationFrame(tick);
      }
    };

    // --- scroll -----------------------------------------------------------------
    let lastScrollY = window.scrollY;
    const stopScroll = observeScrollProgress(root, () => {
      const delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      if (dragging || delta === 0) return;
      const push = Math.max(-40, Math.min(40, delta));
      // A twist, and a nudge upwards on the way down so the thread catches the card.
      spin = Math.max(-2.2, Math.min(2.2, spin + push * 0.012));
      if (push > 0) vel.y = Math.max(-260, vel.y - push * 5);
      wake();
    });

    // --- pointer ----------------------------------------------------------------
    const toLocal = (event: PointerEvent): Vec => {
      const rect = root.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const local = toLocal(event);
      const offset = rotate({ x: local.x - pos.x, y: local.y - pos.y }, -angle);
      grabLocal.x = offset.x;
      grabLocal.y = offset.y;
      target.x = local.x;
      target.y = local.y;
      dragging = true;
      card.classList.add("is-dragging");
      try {
        card.setPointerCapture(event.pointerId);
      } catch {
        // A pointer that is already gone cannot be captured; the drag still works.
      }
      event.preventDefault();
      wake();
    };

    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const local = toLocal(event);
      // The thread has a reach: anchor to clip, clip to the held point, plus a little give.
      const reach =
        ropeLength +
        Math.hypot(grabLocal.x - clipLocal.x, grabLocal.y - clipLocal.y) +
        10;
      let dx = local.x - anchor.x;
      let dy = local.y - anchor.y;
      const distance = Math.hypot(dx, dy);
      if (distance > reach) {
        dx *= reach / distance;
        dy *= reach / distance;
      }
      target.x = anchor.x + dx;
      target.y = anchor.y + dy;
    };

    const onUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      card.classList.remove("is-dragging");
      if (card.hasPointerCapture(event.pointerId)) card.releasePointerCapture(event.pointerId);
      wake();
    };

    card.classList.add("idcard-grab");
    card.addEventListener("pointerdown", onDown);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerup", onUp);
    card.addEventListener("pointercancel", onUp);

    paint();

    return () => {
      stopScroll();
      if (frame) cancelAnimationFrame(frame);
      card.classList.remove("idcard-grab", "is-dragging");
      card.removeEventListener("pointerdown", onDown);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerup", onUp);
      card.removeEventListener("pointercancel", onUp);
      card.style.removeProperty("transform");
      card.style.removeProperty("--sheen");
    };
  }, [container, body, parts.strap, parts.edges, parts.hardware, length, width, height, links, gravity]);
}
