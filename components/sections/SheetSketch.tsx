"use client";

import { useEffect, useRef } from "react";
import { useMotionEnabled } from "@/lib/motion/use-motion-enabled";

/*
  The hero is drawn on a schematic sheet, so the sheet takes a pencil. Drag across any
  empty part of the grid and a graphite stroke follows the pointer. Let go and the
  stroke drafts itself: the scribble straightens into clean segments snapped to the
  eight compass angles, the longest one gets a dimension label in grid units, then the
  whole thing fades like an eraser passing over it.

  One canvas over the section, one requestAnimationFrame loop that runs only while a
  stroke exists. Text, links, buttons and the portrait are not sketchable, so selecting,
  clicking and dragging the image all behave as before. Desktop, fine pointer and motion
  allowed only; the parent mounts nothing otherwise.
*/

type Point = { x: number; y: number };

type Stroke = {
  raw: Point[];
  snapped: Point[];
  /** Milliseconds since the stroke was released; -1 while still being drawn. */
  released: number;
  /** Index of the longest snapped segment, for the dimension label. */
  longest: number;
};

const GRID = 72; // px, matching .sheet-grid
const MORPH_MS = 380;
const HOLD_MS = 1600;
const FADE_MS = 900;
const NOT_SKETCHABLE = "a, button, input, textarea, img, [data-no-sketch]";
const TEXT = "p, h1, h2, h3, dt, dd, span";
const TEXT_PAD = 6; // px around a line of text that still counts as text

/*
  A heading's box spans its whole column, so "inside a text element" would refuse the
  empty sheet beside the name. Only the line boxes of the text itself count, with a
  little padding, so selecting still works on words and sketching everywhere else.
*/
function overText(target: Element, x: number, y: number) {
  const text = target.closest(TEXT);
  if (!text) return false;
  const range = document.createRange();
  range.selectNodeContents(text);
  for (const rect of range.getClientRects()) {
    if (
      x >= rect.left - TEXT_PAD &&
      x <= rect.right + TEXT_PAD &&
      y >= rect.top - TEXT_PAD &&
      y <= rect.bottom + TEXT_PAD
    ) {
      return true;
    }
  }
  return false;
}

/* Ramer–Douglas–Peucker: keep only the corners that matter. */
function simplify(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;
  const [first, last] = [points[0], points[points.length - 1]];
  let index = -1;
  let maxDistance = 0;
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const length = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const distance = Math.abs(dy * p.x - dx * p.y + last.x * first.y - last.y * first.x) / length;
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }
  if (maxDistance > epsilon) {
    const left = simplify(points.slice(0, index + 1), epsilon);
    const right = simplify(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

/* Snap each segment to the nearest 45° and chain them so the corners stay joined. */
function draft(points: Point[]): Point[] {
  const corners = simplify(points, 7);
  const out: Point[] = [corners[0]];
  for (let i = 1; i < corners.length; i++) {
    const from = out[i - 1];
    const dx = corners[i].x - from.x;
    const dy = corners[i].y - from.y;
    const length = Math.hypot(dx, dy);
    if (length < 4) {
      out.push(from);
      continue;
    }
    const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
    out.push({ x: from.x + Math.cos(angle) * length, y: from.y + Math.sin(angle) * length });
  }
  return mergeCollinear(out);
}

/* Two snapped segments at the same angle are one line; drop the joint between them. */
function mergeCollinear(points: Point[]): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i > 0 && i < points.length - 1) {
      const a = out[out.length - 1];
      const b = points[i];
      const c = points[i + 1];
      const ab = Math.atan2(b.y - a.y, b.x - a.x);
      const bc = Math.atan2(c.y - b.y, c.x - b.x);
      if (Math.abs(ab - bc) < 1e-6) continue;
    }
    out.push(points[i]);
  }
  return out;
}

/* The freehand path resampled to the same count as the drafted one, so it can tween. */
function resample(points: Point[], count: number): Point[] {
  if (count <= 1 || points.length === 1) return Array.from({ length: count }, () => points[0]);
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  }
  const total = lengths[lengths.length - 1] || 1;
  const out: Point[] = [];
  let j = 0;
  for (let k = 0; k < count; k++) {
    const target = (k / (count - 1)) * total;
    while (j < lengths.length - 2 && lengths[j + 1] < target) j++;
    const span = lengths[j + 1] - lengths[j] || 1;
    const t = Math.min(1, Math.max(0, (target - lengths[j]) / span));
    out.push({
      x: points[j].x + (points[j + 1].x - points[j].x) * t,
      y: points[j].y + (points[j + 1].y - points[j].y) * t,
    });
  }
  return out;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function SheetSketch() {
  const enabled = useMotionEnabled();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest("section");
    if (!enabled || !canvas || !section) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const strokes: Stroke[] = [];
    let current: Stroke | null = null;
    let frame = 0;
    let last = 0;
    let accent = "#5c8dff";
    let ink = "#e6eaf2";

    const fit = () => {
      const scale = window.devicePixelRatio || 1;
      const { width, height } = section.getBoundingClientRect();
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      const styles = getComputedStyle(section);
      accent = styles.getPropertyValue("--color-accent").trim() || accent;
      ink = styles.getPropertyValue("--color-ink").trim() || ink;
    };

    const local = (event: PointerEvent): Point => {
      const bounds = section.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };

    const drawPath = (points: Point[]) => {
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) context.lineTo(points[i].x, points[i].y);
      context.stroke();
    };

    const drawDimension = (a: Point, b: Point, alpha: number) => {
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      if (length < GRID * 0.75) return;
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      // Read left to right, and bottom to top on a vertical, as on a drawing.
      const cosine = Math.cos(angle);
      const flip = cosine < -1e-6 || (Math.abs(cosine) <= 1e-6 && Math.sin(angle) > 0);
      const upright = flip ? angle + Math.PI : angle;
      const label = `${(length / GRID).toFixed(1)} units`;
      context.save();
      context.globalAlpha = alpha;
      context.translate((a.x + b.x) / 2, (a.y + b.y) / 2);
      context.rotate(upright);
      // End ticks, like a dimension line on a drawing.
      context.strokeStyle = accent;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(-length / 2, -5);
      context.lineTo(-length / 2, 5);
      context.moveTo(length / 2, -5);
      context.lineTo(length / 2, 5);
      context.stroke();
      context.font = "10px var(--font-plex-mono), ui-monospace, monospace";
      context.textAlign = "center";
      context.textBaseline = "bottom";
      context.fillStyle = accent;
      context.fillText(label, 0, -7);
      context.restore();
    };

    const render = (now: number) => {
      frame = 0;
      const dt = last ? now - last : 0;
      last = now;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.lineCap = "round";
      context.lineJoin = "round";

      let alive = false;
      for (let s = strokes.length - 1; s >= 0; s--) {
        const stroke = strokes[s];
        if (stroke.released >= 0) stroke.released += dt;

        if (stroke.released < 0) {
          // Graphite: soft, slightly heavy, a little translucent.
          context.globalAlpha = 0.55;
          context.strokeStyle = ink;
          context.lineWidth = 1.6;
          if (stroke.raw.length > 1) drawPath(stroke.raw);
          alive = true;
          continue;
        }

        const t = stroke.released;
        if (t > MORPH_MS + HOLD_MS + FADE_MS) {
          strokes.splice(s, 1);
          continue;
        }
        alive = true;

        const morph = easeOut(Math.min(1, t / MORPH_MS));
        const fade = t > MORPH_MS + HOLD_MS ? 1 - (t - MORPH_MS - HOLD_MS) / FADE_MS : 1;
        const from = resample(stroke.raw, stroke.snapped.length);
        const points = stroke.snapped.map((p, i) => ({
          x: from[i].x + (p.x - from[i].x) * morph,
          y: from[i].y + (p.y - from[i].y) * morph,
        }));

        // Graphite gives way to ink as the line straightens.
        context.globalAlpha = 0.55 * (1 - morph) * fade;
        context.strokeStyle = ink;
        context.lineWidth = 1.6;
        if (morph < 1) drawPath(stroke.raw);

        context.globalAlpha = (0.35 + 0.65 * morph) * fade;
        context.strokeStyle = accent;
        context.lineWidth = 1;
        drawPath(points);

        // Corner dots, once drafted.
        if (morph > 0.6) {
          context.fillStyle = accent;
          context.globalAlpha = ((morph - 0.6) / 0.4) * fade;
          for (const p of points) {
            context.beginPath();
            context.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
            context.fill();
          }
        }

        if (morph === 1 && stroke.longest >= 0) {
          drawDimension(points[stroke.longest], points[stroke.longest + 1], fade);
        }
      }
      context.globalAlpha = 1;

      if (alive) frame = requestAnimationFrame(render);
      else last = 0;
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target as Element | null;
      if (!target || target.closest(NOT_SKETCHABLE)) return;
      if (overText(target, event.clientX, event.clientY)) return;
      current = { raw: [local(event)], snapped: [], released: -1, longest: -1 };
      strokes.push(current);
      // Capture keeps the stroke alive past the section's edge. Fails only for a
      // pointer the browser does not know, which a real one never is.
      try {
        section.setPointerCapture(event.pointerId);
      } catch {}
      event.preventDefault();
      schedule();
    };

    const onMove = (event: PointerEvent) => {
      if (!current) return;
      const point = local(event);
      const previous = current.raw[current.raw.length - 1];
      if (Math.hypot(point.x - previous.x, point.y - previous.y) < 1.5) return;
      current.raw.push(point);
      schedule();
    };

    const onUp = (event: PointerEvent) => {
      if (!current) return;
      const stroke = current;
      current = null;
      if (section.hasPointerCapture(event.pointerId)) section.releasePointerCapture(event.pointerId);
      // A click, or a stroke too short to read as a line, leaves nothing behind.
      const first = stroke.raw[0];
      const end = stroke.raw[stroke.raw.length - 1];
      if (stroke.raw.length < 2 || Math.hypot(end.x - first.x, end.y - first.y) < 8) {
        strokes.splice(strokes.indexOf(stroke), 1);
        schedule();
        return;
      }
      stroke.snapped = draft(stroke.raw);
      let best = -1;
      let bestLength = 0;
      for (let i = 0; i < stroke.snapped.length - 1; i++) {
        const a = stroke.snapped[i];
        const b = stroke.snapped[i + 1];
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        if (length > bestLength) {
          bestLength = length;
          best = i;
        }
      }
      stroke.longest = best;
      stroke.released = 0;
      schedule();
    };

    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(section);
    section.classList.add("is-sketchable");
    section.addEventListener("pointerdown", onDown);
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerup", onUp);
    section.addEventListener("pointercancel", onUp);

    return () => {
      resize.disconnect();
      section.classList.remove("is-sketchable");
      section.removeEventListener("pointerdown", onDown);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerup", onUp);
      section.removeEventListener("pointercancel", onUp);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5]"
      />
      <p
        aria-hidden="true"
        className="sketch-hint pointer-events-none absolute right-5 bottom-4 z-[5] font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint sm:right-8"
      >
        ✎ Draw on the sheet
      </p>
    </>
  );
}
