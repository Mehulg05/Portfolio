"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ContactDialog } from "@/components/ui/ContactDialog";
import { profile } from "@/lib/content/profile";
import { useMotionEnabled } from "@/lib/motion/use-motion-enabled";

/*
  The contact toy. An envelope sits in a slingshot; Mehul's inbox tray waits on the far
  side of the frame. Pull the envelope back, watch the dotted delivery path and the
  verdict in the corner, let go. Land it and the form opens. Miss, and a panel offers
  another go or a straight route to the form.

  Everything is inline SVG plus one requestAnimationFrame loop that runs only while an
  envelope is in the air. The physics is one pure function shared by the live preview
  and the real flight, so the path you see is the path you get.
*/

/* ─── Geometry (viewBox units) ────────────────────────────────────────────── */

const W = 600;
const H = 280;
const FLOOR = 238;

const ENV_HW = 17; // envelope half width
const ENV_HH = 11; // envelope half height

/* The slingshot: a post from the floor up to a fork; the envelope rests between the tips. */
const PAD = { x: 96, y: 146 };
const FORK_Y = PAD.y + 26; // where the two prongs meet the post
const PRONG = 18; // half distance between the prong tips
const MAX_PULL = 150;

const TRAY = { x0: 468, x1: 556, top: 172, bottom: FLOOR };
const TRAY_LIP = TRAY.top + 20; // top edge of the front wall; the back panel rises to TRAY.top
const TRAY_CX = (TRAY.x0 + TRAY.x1) / 2;
/* A delivered envelope stands in the tray, peeking over the front lip like the letters already there. */
const TRAY_REST = { x: TRAY_CX + 2, y: TRAY_LIP - 4 };

/* Letters already waiting in the tray, drawn as slightly skewed rectangles behind the front lip. */
const TRAY_LETTERS = [
  { dx: -30, dy: 3, w: 58, h: 12, tilt: -3 },
  { dx: -26, dy: 6, w: 56, h: 12, tilt: 2 },
  { dx: -32, dy: 9, w: 60, h: 12, tilt: -1 },
];

/* Physics, in viewBox units, degrees and seconds. */
const GRAVITY = 900;
const AIR_DRAG = 0.12; // per second: it is paper, not a cannonball
const PULL_TO_SPEED = 5.2;
const MAX_SPEED = 820;
const LAUNCH_TUMBLE = 0.3; // deg/s of spin per unit of horizontal launch speed
const WALL_BOUNCE = 0.55;
const FLOOR_BOUNCE = 0.42;
const FLOOR_GRIP = 0.72; // sideways speed kept through a floor bounce
const SLIDE_DRAG = 5; // per second, once skidding along the floor
const BOUNCE_MIN_VY = 110; // slower than this it skids instead of bouncing
const TRAY_BOUNCE = 0.3;
const MIN_LAUNCH_SPEED = 60;
const REST_SPEED = 10;

/* The slingshot's elastic: bands and post recoil as damped springs after a release. */
const BAND_K = 1400;
const BAND_ZETA = 0.22;
const POST_K = 625;
const POST_ZETA = 0.18;
const POST_KICK = 0.12; // initial deg/s of post wobble per unit of launch speed

/* Timings */
const DELIVERED_TO_FORM_MS = 650;
const RESET_AFTER_DELIVERY_MS = 1600;
const MISS_SETTLE_MS = 350; // let a missed envelope lie there a moment before the panel
const FLIGHT_SAFETY_S = 9; // simulated time: a shot that never settles
const FLIGHT_WATCHDOG_MS = 9000; // wall time: a tab that never paints

type Phase = "idle" | "aiming" | "flying" | "delivered" | "missed";

/* ─── Physics ─────────────────────────────────────────────────────────────── */

type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Degrees, clockwise. */
  angle: number;
  /** Degrees per second. */
  spin: number;
  /** Once it has dropped through the tray's mouth it is boxed in by the tray. */
  inside: boolean;
  /** Set on first touchdown, floor or tray; the preview stops there, the flight goes on. */
  landed: boolean;
};
type Outcome = "air" | "delivered" | "rest";

function makeBody(v: { x: number; y: number }): Body {
  return {
    x: PAD.x,
    y: PAD.y,
    vx: v.x,
    vy: v.y,
    angle: 0,
    spin: v.x * LAUNCH_TUMBLE,
    inside: false,
    landed: false,
  };
}

/** Ease `angle` towards the nearest `every` degrees, the way a flat thing lies down. */
function flatten(b: Body, every: number, rate: number, dt: number) {
  const target = Math.round(b.angle / every) * every;
  b.angle += (target - b.angle) * Math.min(1, rate * dt);
  b.spin *= Math.max(0, 1 - 12 * dt);
  return Math.abs(b.angle - target) < 0.5;
}

/**
  One step of the world. Mutates `b`; returns what happened. Deterministic, so the
  preview and the flight agree — including the bounces.
*/
function advance(b: Body, dt: number): Outcome {
  b.vy += GRAVITY * dt;
  const drag = 1 - AIR_DRAG * dt;
  b.vx *= drag;
  b.vy *= drag;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.angle += b.spin * dt;
  b.spin *= 1 - 0.6 * dt;

  if (b.inside) {
    // Boxed in: the tray's inner walls, and the bed of letters it comes to rest on.
    const left = TRAY.x0 + 4 + ENV_HW;
    const right = TRAY.x1 - 4 - ENV_HW;
    if (b.x < left) {
      b.x = left;
      b.vx = -b.vx * TRAY_BOUNCE;
    } else if (b.x > right) {
      b.x = right;
      b.vx = -b.vx * TRAY_BOUNCE;
    }
    if (b.y > TRAY_REST.y) {
      b.y = TRAY_REST.y;
      if (b.vy > 90) {
        b.vy = -b.vy * TRAY_BOUNCE;
        b.vx *= 0.6;
      } else {
        // Sitting on the letters: the bed is a shallow dip, so it slides to the middle.
        b.vy = 0;
        b.vx += (TRAY_REST.x - b.x) * 40 * dt;
        b.vx *= Math.max(0, 1 - 12 * dt);
        const flat = flatten(b, 360, 16, dt);
        if (flat && Math.abs(b.vx) < REST_SPEED * 2 && Math.abs(b.x - TRAY_REST.x) < 4) {
          b.x = TRAY_REST.x;
          b.vx = 0;
          b.spin = 0;
          return "delivered";
        }
      }
    } else {
      flatten(b, 360, 4, dt);
    }
    return "air";
  }

  // Frame walls and ceiling.
  if (b.x < ENV_HW) {
    b.x = ENV_HW;
    b.vx = -b.vx * WALL_BOUNCE;
    b.spin = -b.spin * 0.5;
  } else if (b.x > W - ENV_HW) {
    b.x = W - ENV_HW;
    b.vx = -b.vx * WALL_BOUNCE;
    b.spin = -b.spin * 0.5;
  }
  if (b.y < ENV_HH) {
    b.y = ENV_HH;
    b.vy = -b.vy * WALL_BOUNCE;
  }

  // Through the tray's mouth, and it is in.
  if (b.x > TRAY.x0 + 4 && b.x < TRAY.x1 - 4 && b.y > TRAY.top - 2 && b.vy > 0) {
    b.inside = true;
    b.landed = true;
    return "air";
  }

  // The tray's outer walls: arriving low from either side just bounces off. Judged by
  // the centre, so a corner clipping the rim on the way in still counts as in.
  if (b.y > TRAY.top) {
    if (b.vx > 0 && b.x < TRAY.x0 && b.x + ENV_HW > TRAY.x0) {
      b.x = TRAY.x0 - ENV_HW;
      b.vx = -b.vx * WALL_BOUNCE * 0.6;
      b.spin = -b.spin * 0.5;
    } else if (b.vx < 0 && b.x > TRAY.x1 && b.x - ENV_HW < TRAY.x1) {
      b.x = TRAY.x1 + ENV_HW;
      b.vx = -b.vx * WALL_BOUNCE * 0.6;
      b.spin = -b.spin * 0.5;
    }
  }

  // The floor: bounce while it is coming down hard, then skid and lie flat.
  if (b.y > FLOOR - ENV_HH) {
    b.y = FLOOR - ENV_HH;
    b.landed = true;
    if (b.vy > BOUNCE_MIN_VY) {
      b.vy = -b.vy * FLOOR_BOUNCE;
      b.vx *= FLOOR_GRIP;
      // The edge that hits drags: it tumbles on in the direction of travel.
      b.spin = b.vx * 0.8 + b.spin * 0.3;
    } else {
      b.vy = 0;
      b.vx *= Math.max(0, 1 - SLIDE_DRAG * dt);
      const flat = flatten(b, 180, 14, dt);
      if (flat && Math.abs(b.vx) < REST_SPEED) {
        b.vx = 0;
        b.spin = 0;
        b.angle = Math.round(b.angle / 180) * 180;
        return "rest";
      }
    }
  }
  return "air";
}

/**
  Run a shot instantly up to its first touchdown: the dotted path to that point, and
  whether that point is the tray or the floor. What it does after — the bounces, the
  skid — is left for the flight to show.
*/
function predict(v: { x: number; y: number }) {
  const b = makeBody(v);
  const dots: string[] = [];
  for (let i = 0; i < 600 && !b.landed; i++) {
    if (advance(b, 1 / 60) !== "air") break;
    if (i % 3 === 0) dots.push(`${b.x.toFixed(1)},${b.y.toFixed(1)}`);
  }
  const outcome: "delivered" | "floor" = b.inside ? "delivered" : "floor";
  return { outcome, x: b.x, y: b.y, missBy: missBy(b.x), dots: dots.join(" ") };
}

/*
  A damped spring, stepped semi-implicitly so it stays stable at frame rates. Used for
  the bands snapping back to the fork and the post wobbling on its base.
*/
type Spring = { x: number; v: number };
function springStep(s: Spring, target: number, k: number, zeta: number, dt: number) {
  const c = 2 * Math.sqrt(k) * zeta;
  s.v += (-k * (s.x - target) - c * s.v) * dt;
  s.x += s.v * dt;
  return Math.abs(s.x - target) < 0.15 && Math.abs(s.v) < 2;
}

/** Signed gap between a landing x and the tray: negative is short, positive is long, 0 is in. */
function missBy(x: number) {
  if (x < TRAY.x0) return -Math.round(TRAY.x0 - x);
  if (x > TRAY.x1) return Math.round(x - TRAY.x1);
  return 0;
}

/** "short by 40" / "long by 12" for the readout and the miss panel. */
function missLabel(gap: number) {
  if (gap === 0) return "just wide";
  return gap < 0 ? `short by ${-gap}` : `long by ${gap}`;
}

function clampSpeed(v: { x: number; y: number }) {
  const s = Math.hypot(v.x, v.y);
  if (s <= MAX_SPEED) return v;
  return { x: (v.x / s) * MAX_SPEED, y: (v.y / s) * MAX_SPEED };
}


/* ─── Component ───────────────────────────────────────────────────────────── */

export function ContactAirmail() {
  const motion = useMotionEnabled(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [delivered, setDelivered] = useState(0);
  const [verdict, setVerdict] = useState<"inbox" | "short" | "long" | null>(null);
  const [shot, setShot] = useState<{ angle: number; missBy: number } | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const envRef = useRef<SVGGElement>(null);
  const postRef = useRef<SVGGElement>(null);
  const bandLeftRef = useRef<SVGLineElement>(null);
  const bandRightRef = useRef<SVGLineElement>(null);
  const previewRef = useRef<SVGPolylineElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const trailRef = useRef<SVGPolylineElement>(null);

  const phaseRef = useRef<Phase>("idle");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const timers = useRef<number[]>([]);
  const raf = useRef(0);
  const drag = useRef<{ id: number; startX: number; startY: number; moved: boolean } | null>(null);

  const openThread = useCallback(() => setThreadOpen(true), []);
  const closeThread = useCallback(() => setThreadOpen(false), []);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      cancelAnimationFrame(raf.current);
    },
    [],
  );

  /* ─── Drawing (direct DOM writes; nothing re-renders per frame) ──────────── */

  const placeEnvelope = useCallback((x: number, y: number, angle: number) => {
    envRef.current?.setAttribute(
      "transform",
      `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})`,
    );
  }, []);

  /* The two bands run from the prong tips to the envelope, wherever it is. */
  const drawBands = useCallback((x: number, y: number) => {
    bandLeftRef.current?.setAttribute("x2", (x - 4).toFixed(1));
    bandLeftRef.current?.setAttribute("y2", y.toFixed(1));
    bandRightRef.current?.setAttribute("x2", (x + 4).toFixed(1));
    bandRightRef.current?.setAttribute("y2", y.toFixed(1));
  }, []);

  /* The post leans on its base; the bands are fixed to its prongs, so they lean with it. */
  const drawPost = useCallback((degrees: number) => {
    const transform = degrees === 0 ? "" : `rotate(${degrees.toFixed(2)} ${PAD.x} ${FLOOR})`;
    postRef.current?.setAttribute("transform", transform);
    bandLeftRef.current?.setAttribute("transform", transform);
    bandRightRef.current?.setAttribute("transform", transform);
  }, []);

  const drawPreview = useCallback((v: { x: number; y: number } | null) => {
    const line = previewRef.current;
    const marker = markerRef.current;
    if (!line || !marker) return;
    if (!v) {
      line.setAttribute("points", "");
      marker.setAttribute("opacity", "0");
      setVerdict(null);
      return;
    }
    const p = predict(v);
    line.setAttribute("points", p.dots);
    marker.setAttribute("opacity", "1");
    marker.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    marker.dataset.hit = p.outcome === "delivered" ? "yes" : "no";
    setVerdict(p.outcome === "delivered" ? "inbox" : p.x < TRAY.x0 ? "short" : "long");
    setShot({
      angle: Math.round((-Math.atan2(v.y, v.x) * 180) / Math.PI),
      missBy: p.missBy,
    });
  }, []);

  const toLocal = useCallback((event: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: PAD.x, y: PAD.y };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H,
    };
  }, []);

  /** Where the envelope sits while pulled: the pointer, held within the pull radius. */
  const pullPoint = useCallback((p: { x: number; y: number }) => {
    const dx = p.x - PAD.x;
    const dy = p.y - PAD.y;
    const d = Math.hypot(dx, dy);
    const k = d > MAX_PULL ? MAX_PULL / d : 1;
    return {
      x: Math.min(Math.max(PAD.x + dx * k, ENV_HW), W - ENV_HW),
      y: Math.min(Math.max(PAD.y + dy * k, ENV_HH), FLOOR - ENV_HH),
    };
  }, []);

  const velocityFrom = useCallback(
    (pull: { x: number; y: number }) =>
      clampSpeed({ x: (PAD.x - pull.x) * PULL_TO_SPEED, y: (PAD.y - pull.y) * PULL_TO_SPEED }),
    [],
  );

  /* ─── Flight ──────────────────────────────────────────────────────────────── */

  const resetToPad = useCallback(() => {
    cancelAnimationFrame(raf.current);
    placeEnvelope(PAD.x, PAD.y, 0);
    drawBands(PAD.x, PAD.y);
    drawPost(0);
    trailRef.current?.setAttribute("points", "");
    setPhase("idle");
  }, [drawBands, drawPost, placeEnvelope]);

  /*
    The elastic, after a release: the bands snap back towards the fork and overshoot a
    few times, and the post rocks on its base. Both are springs stepped alongside
    whatever else the frame is doing. Returns true once both are still.
  */
  const makeRecoil = useCallback(
    (from: { x: number; y: number }, speed: number) => {
      const band = { x: { x: from.x, v: 0 }, y: { x: from.y, v: 0 } };
      const post: Spring = { x: 0, v: -Math.sign(from.x - PAD.x || 1) * speed * POST_KICK };
      const point = { x: from.x, y: from.y };
      let bandsStill = false;
      let postStill = false;
      const step = (dt: number) => {
        if (!bandsStill) {
          const sx = springStep(band.x, PAD.x, BAND_K, BAND_ZETA, dt);
          const sy = springStep(band.y, PAD.y, BAND_K, BAND_ZETA, dt);
          bandsStill = sx && sy;
          point.x = bandsStill ? PAD.x : band.x.x;
          point.y = bandsStill ? PAD.y : band.y.x;
          drawBands(point.x, point.y);
        }
        if (!postStill) {
          postStill = springStep(post, 0, POST_K, POST_ZETA, dt);
          drawPost(postStill ? 0 : post.x);
        }
        return bandsStill && postStill;
      };
      return { step, point };
    },
    [drawBands, drawPost],
  );

  /* A pull too short to launch: the envelope rides the bands back to the fork. */
  const springBack = useCallback(
    (from: { x: number; y: number }) => {
      cancelAnimationFrame(raf.current);
      const recoil = makeRecoil(from, Math.hypot(from.x - PAD.x, from.y - PAD.y) * 2);
      let last = performance.now();
      const step = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.032);
        last = now;
        const still = recoil.step(dt);
        placeEnvelope(recoil.point.x, recoil.point.y, 0);
        if (still) {
          resetToPad();
          return;
        }
        raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    },
    [makeRecoil, placeEnvelope, resetToPad],
  );

  const launch = useCallback(
    (v: { x: number; y: number }, from: { x: number; y: number }) => {
      cancelAnimationFrame(raf.current);
      drawPreview(null);
      setPhase("flying");

      const b = makeBody(v);
      const recoil = makeRecoil(from, Math.hypot(v.x, v.y));
      let recoilDone = false;
      let last = performance.now();
      let elapsed = 0;
      const trail: string[] = [];

      const finishMiss = (landedX: number) => {
        setShot((prev) => (prev ? { ...prev, missBy: missBy(landedX) } : prev));
        setPhase("missed");
      };

      const finishDelivery = () => {
        placeEnvelope(TRAY_REST.x, TRAY_REST.y, 0);
        trailRef.current?.setAttribute("points", "");
        setDelivered((n) => n + 1);
        setPhase("delivered");
        later(openThread, DELIVERED_TO_FORM_MS);
        later(resetToPad, RESET_AFTER_DELIVERY_MS);
      };

      const settleElastic = () => {
        if (recoilDone) return;
        recoilDone = true;
        drawBands(PAD.x, PAD.y);
        drawPost(0);
      };

      const step = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.032);
        last = now;
        elapsed += dt;

        if (!recoilDone) recoilDone = recoil.step(dt);

        const outcome = advance(b, dt);
        placeEnvelope(b.x, b.y, b.angle);

        if (outcome === "delivered") {
          settleElastic();
          finishDelivery();
          return;
        }
        if (outcome === "rest") {
          settleElastic();
          later(() => finishMiss(b.x), MISS_SETTLE_MS);
          return;
        }

        // The trail only follows it through the air; a skid leaves no vapour.
        if (b.inside || b.y < FLOOR - ENV_HH - 0.5) {
          trail.push(`${b.x.toFixed(1)},${b.y.toFixed(1)}`);
        }
        if (trail.length > 26) trail.shift();
        trailRef.current?.setAttribute("points", trail.join(" "));

        if (elapsed > FLIGHT_SAFETY_S) {
          settleElastic();
          finishMiss(b.x);
          return;
        }
        raf.current = requestAnimationFrame(step);
      };

      raf.current = requestAnimationFrame(step);

      /*
        Animation frames stop in a hidden tab, so a flight there would never resolve.
        Wall-clock watchdog: settle it the way the prediction said it would go.
      */
      const expected = predict(v);
      later(() => {
        if (phaseRef.current !== "flying") return;
        cancelAnimationFrame(raf.current);
        settleElastic();
        if (expected.outcome === "delivered") finishDelivery();
        else finishMiss(expected.x);
      }, FLIGHT_WATCHDOG_MS);
    },
    [drawBands, drawPost, drawPreview, later, makeRecoil, openThread, placeEnvelope, resetToPad],
  );

  /* ─── Pointer handling on the envelope's hit area ────────────────────────── */

  const onGrab = useCallback(
    (event: React.PointerEvent<SVGCircleElement>) => {
      if (!motion || phaseRef.current !== "idle") return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Some engines refuse capture on SVG children; the drag still works while
        // the pointer stays over the frame.
      }
      const p = toLocal(event);
      drag.current = { id: event.pointerId, startX: p.x, startY: p.y, moved: false };
      setPhase("aiming");
    },
    [motion, toLocal],
  );

  const onPull = useCallback(
    (event: React.PointerEvent<SVGCircleElement>) => {
      const d = drag.current;
      if (!d || d.id !== event.pointerId) return;
      const p = toLocal(event);
      if (!d.moved && Math.hypot(p.x - d.startX, p.y - d.startY) > 6) d.moved = true;
      if (!d.moved) return;
      const pull = pullPoint(p);
      const v = velocityFrom(pull);
      const tilt = ((Math.atan2(PAD.y - pull.y, PAD.x - pull.x) * 180) / Math.PI) * 0.35;
      placeEnvelope(pull.x, pull.y, tilt);
      drawBands(pull.x, pull.y);
      drawPreview(v);
    },
    [drawBands, drawPreview, placeEnvelope, pullPoint, toLocal, velocityFrom],
  );

  const onRelease = useCallback(
    (event: React.PointerEvent<SVGCircleElement>) => {
      const d = drag.current;
      if (!d || d.id !== event.pointerId) return;
      drag.current = null;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Never captured; nothing to release.
      }

      const pull = d.moved ? pullPoint(toLocal(event)) : { x: PAD.x, y: PAD.y };
      const v = d.moved ? velocityFrom(pull) : { x: 0, y: 0 };
      // A tap, or a pull too short to leave the fork, rides the bands back.
      if (Math.hypot(v.x, v.y) < MIN_LAUNCH_SPEED) {
        drawPreview(null);
        springBack(pull);
        return;
      }
      launch(v, pull);
    },
    [drawPreview, launch, pullPoint, springBack, toLocal, velocityFrom],
  );

  /* Keyboard users skip the game: Enter or Space on the frame opens the form. */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openThread();
    },
    [openThread],
  );

  const tryAgain = useCallback(() => {
    drawPreview(null);
    resetToPad();
  }, [drawPreview, resetToPad]);

  const sendInstead = useCallback(() => {
    tryAgain();
    openThread();
  }, [tryAgain, openThread]);

  const aiming = phase === "aiming";
  const live = phase !== "idle";

  const hint = (() => {
    if (aiming && verdict && shot) {
      const call = verdict === "inbox" ? "lands in inbox" : missLabel(shot.missBy);
      return `${call} · ${shot.angle}°`;
    }
    if (phase === "flying") return shot ? `in flight · ${shot.angle}°` : "in flight";
    if (phase === "delivered") return "delivered";
    if (phase === "missed") return shot ? `missed · ${missLabel(shot.missBy)}` : "missed";
    if (!motion) return "press enter to write";
    return "pull the envelope back";
  })();

  return (
    <figure className="m-0">
      <div className="tick-frame relative max-w-[440px] border border-line bg-surface">
        <div
          role="button"
          tabIndex={0}
          aria-label={`Start a thread with ${profile.name}`}
          aria-haspopup="dialog"
          onKeyDown={onKeyDown}
          className="block select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="block aspect-[15/7] w-full"
            aria-hidden="true"
            focusable="false"
          >
            {/* Floor */}
            <line x1="0" y1={FLOOR} x2={W} y2={FLOOR} className="stroke-line-bright" />
            <line x1="0" y1={FLOOR + 6} x2={W} y2={FLOOR + 6} className="stroke-line" strokeDasharray="2 6" />

            {/* Slingshot: post, fork, prongs. Rocks on its base after a release. */}
            <g ref={postRef} fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1={PAD.x - 12} y1={FLOOR} x2={PAD.x + 12} y2={FLOOR} className="stroke-ink-dim" strokeWidth="3" />
              <line x1={PAD.x} y1={FLOOR} x2={PAD.x} y2={FORK_Y} className="stroke-ink-dim" strokeWidth="3" />
              <path
                d={`M${PAD.x - PRONG} ${PAD.y - 4} Q${PAD.x - PRONG + 4} ${FORK_Y - 4} ${PAD.x} ${FORK_Y} Q${PAD.x + PRONG - 4} ${FORK_Y - 4} ${PAD.x + PRONG} ${PAD.y - 4}`}
                className="stroke-ink-dim"
                strokeWidth="3"
              />
            </g>

            {/* The back band, behind the envelope */}
            <line
              ref={bandLeftRef}
              x1={PAD.x - PRONG}
              y1={PAD.y - 4}
              x2={PAD.x - 4}
              y2={PAD.y}
              strokeWidth="2"
              strokeLinecap="round"
              className={aiming ? "stroke-accent" : "stroke-ink-dim"}
            />

            {/* Predicted path and landing marker, drawn only while aiming */}
            <polyline
              ref={previewRef}
              fill="none"
              className="stroke-accent"
              strokeWidth="3"
              strokeDasharray="0 9"
              strokeLinecap="round"
              opacity="0.8"
            />
            <g ref={markerRef} opacity="0" className="landing-marker">
              <circle r="9" fill="none" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="-4" y1="0" x2="4" y2="0" strokeWidth="1.5" />
              <line x1="0" y1="-4" x2="0" y2="4" strokeWidth="1.5" />
            </g>

            {/* Trail behind a flying envelope */}
            <polyline ref={trailRef} fill="none" className="stroke-accent" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />

            {/* Inbox tray, back half: panel, the letters already in it. The front lip is drawn
                after the envelope so a delivered letter drops in behind it. Both halves
                jolt when a letter lands. */}
            <g className={phase === "delivered" ? "tray-jolt" : ""}>
              {/* Ground shadow */}
              <ellipse cx={TRAY_CX} cy={FLOOR} rx={(TRAY.x1 - TRAY.x0) / 2 + 6} ry="3" className="fill-surface-2" />
              {/* Back panel */}
              <path
                d={`M${TRAY.x0} ${TRAY.bottom} V${TRAY.top + 3} q0 -3 3 -3 H${TRAY.x1 - 3} q3 0 3 3 V${TRAY.bottom}`}
                strokeWidth="1.5"
                className={`fill-surface ${phase === "delivered" ? "stroke-accent" : "stroke-ink-dim"}`}
              />
              {/* Ribs on the back panel */}
              {[0, 1, 2].map((i) => (
                <line
                  key={i}
                  x1={TRAY.x0 + 14 + i * 30}
                  y1={TRAY.top + 6}
                  x2={TRAY.x0 + 14 + i * 30}
                  y2={TRAY_LIP - 2}
                  className="stroke-line"
                />
              ))}
              {/* Letters waiting in the tray */}
              {TRAY_LETTERS.map((l, i) => (
                <g key={i} transform={`translate(${TRAY_CX + l.dx} ${TRAY.top + l.dy}) rotate(${l.tilt})`}>
                  <rect width={l.w} height={l.h} rx="1.5" strokeWidth="1.25" className="fill-surface-2 stroke-line-bright" />
                  <path d={`M0 0 L${l.w / 2} ${l.h * 0.55} L${l.w} 0`} fill="none" strokeWidth="1.25" strokeLinejoin="round" className="stroke-line-bright" />
                </g>
              ))}
              {/* Delivered letters stay in the stack */}
              {Array.from({ length: Math.min(delivered, 3) }, (_, i) => (
                <g key={`d${i}`} transform={`translate(${TRAY_CX - 27 + i * 3} ${TRAY.top - 1 - i * 3}) rotate(${i % 2 ? 2.5 : -2})`}>
                  <rect width="56" height="12" rx="1.5" strokeWidth="1.25" className="fill-surface-2 stroke-accent" />
                  <path d="M0 0 L28 6.5 L56 0" fill="none" strokeWidth="1.25" strokeLinejoin="round" className="stroke-accent" />
                </g>
              ))}
              {/* Landing line: the open mouth of the tray */}
              <line
                x1={TRAY.x0 + 4}
                y1={TRAY.top - 6}
                x2={TRAY.x1 - 4}
                y2={TRAY.top - 6}
                strokeDasharray="2 5"
                className={live ? "stroke-accent" : "stroke-line"}
              />
            </g>

            {/* The envelope */}
            <g ref={envRef} transform={`translate(${PAD.x} ${PAD.y})`}>
              <g className={motion && phase === "idle" ? "env-bob" : ""}>
                <rect
                  x={-ENV_HW}
                  y={-ENV_HH}
                  width={ENV_HW * 2}
                  height={ENV_HH * 2}
                  rx="2"
                  strokeWidth="1.5"
                  className={`fill-surface-2 ${live ? "stroke-accent" : "stroke-ink"}`}
                />
                <path
                  d={`M${-ENV_HW} ${-ENV_HH} L0 ${ENV_HH * 0.25} L${ENV_HW} ${-ENV_HH}`}
                  fill="none"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  className={live ? "stroke-accent" : "stroke-ink"}
                />
                {/* Grab area: larger than the drawing so a thumb can find it. */}
                <circle
                  r={ENV_HW + 18}
                  fill="transparent"
                  style={{ touchAction: "none", cursor: aiming ? "grabbing" : "grab" }}
                  onPointerDown={onGrab}
                  onPointerMove={onPull}
                  onPointerUp={onRelease}
                  onPointerCancel={onRelease}
                />
              </g>
            </g>

            {/* Postmark: stamped on the envelope once it is in the tray. */}
            {phase === "delivered" && (
              <g transform={`translate(${TRAY_REST.x + 4} ${TRAY_REST.y - 3})`}>
                <g className="postmark stamp-now" filter="url(#ink-stamp)" fill="none" strokeLinecap="round">
                  <circle r="9" strokeWidth="1.3" className="stroke-redline" />
                  <circle r="6" strokeWidth="1" className="stroke-redline" />
                  <path d="M12 -4 q3 -2 6 0 t6 0 M12 0 q3 -2 6 0 t6 0 M12 4 q3 -2 6 0 t6 0" strokeWidth="1.2" className="stroke-redline" />
                </g>
              </g>
            )}

            {/* Inbox tray, front lip: a low wall with a thumb notch, a label plate, and the new-mail badge. */}
            <g className={phase === "delivered" ? "tray-jolt" : ""}>
              <path
                d={`M${TRAY.x0} ${TRAY.bottom} V${TRAY_LIP + 3} q0 -3 3 -3 H${TRAY_CX - 11} a11 11 0 0 0 22 0 H${TRAY.x1 - 3} q3 0 3 3 V${TRAY.bottom} Z`}
                strokeWidth="1.5"
                strokeLinejoin="round"
                className={`fill-surface-2 ${phase === "delivered" ? "stroke-accent" : "stroke-ink-dim"}`}
              />
              {/* Lip thickness */}
              <path
                d={`M${TRAY.x0 + 4} ${TRAY_LIP + 4} H${TRAY_CX - 12} a12 12 0 0 0 24 0 H${TRAY.x1 - 4}`}
                fill="none"
                className="stroke-line-bright"
              />
              {/* Label plate */}
              <rect x={TRAY_CX - 17} y={TRAY.bottom - 26} width="34" height="12" rx="1.5" className="fill-surface stroke-line-bright" />
              <line x1={TRAY_CX - 11} y1={TRAY.bottom - 20} x2={TRAY_CX + 11} y2={TRAY.bottom - 20} strokeWidth="2" strokeLinecap="round" className="stroke-ink-faint" />
              {/* Feet */}
              <rect x={TRAY.x0 + 6} y={TRAY.bottom - 3} width="10" height="3" className="fill-ink-dim" />
              <rect x={TRAY.x1 - 16} y={TRAY.bottom - 3} width="10" height="3" className="fill-ink-dim" />
              {delivered > 0 && (
                <g className={phase === "delivered" ? "tray-badge-pop" : ""}>
                  <circle cx={TRAY.x1 - 2} cy={TRAY.top - 2} r="9" strokeWidth="2" className="fill-redline stroke-surface" />
                  <text
                    x={TRAY.x1 - 2}
                    y={TRAY.top + 1.5}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    className="fill-ground font-mono"
                  >
                    {Math.min(delivered, 9)}
                  </text>
                </g>
              )}
            </g>

            {/* The front band, over the envelope */}
            <line
              ref={bandRightRef}
              x1={PAD.x + PRONG}
              y1={PAD.y - 4}
              x2={PAD.x + 4}
              y2={PAD.y}
              strokeWidth="2"
              strokeLinecap="round"
              className={aiming ? "stroke-accent" : "stroke-ink-dim"}
            />
          </svg>

          {/* Labels in HTML so they hold their size at every width. */}
          <div className="pointer-events-none absolute inset-0 font-mono uppercase" aria-hidden="true">
            <span
              className={`absolute top-2.5 right-3 text-[10px] tracking-[0.16em] ${
                phase === "delivered" || verdict === "inbox"
                  ? "text-accent"
                  : phase === "missed"
                    ? "text-redline"
                    : "text-ink-faint"
              }`}
            >
              {hint}
            </span>
            <span
              className="absolute bottom-2.5 -translate-x-1/2 text-[10px] tracking-[0.16em] text-ink-faint"
              style={{ left: `${(PAD.x / W) * 100}%` }}
            >
              you
            </span>
            <span
              className={`absolute bottom-2.5 -translate-x-1/2 text-[10px] tracking-[0.16em] ${
                phase === "delivered" ? "text-accent" : "text-ink-faint"
              }`}
              style={{ left: `${(TRAY_CX / W) * 100}%` }}
            >
              inbox
            </span>
          </div>
        </div>

        {/* Missed: the game has made its point; offer the way out. */}
        {phase === "missed" && (
          <div className="miss-panel absolute inset-0 flex items-center justify-center bg-ground/75 p-4">
            <div className="border border-line bg-surface-2 px-5 py-4 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-redline">
                {shot ? `Missed · ${missLabel(shot.missBy)}` : "Missed the inbox"}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={tryAgain}
                  className="border border-line-bright px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={sendInstead}
                  className="border border-accent bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ground transition-colors hover:bg-accent/85"
                >
                  Send a message
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <figcaption className="mt-3 flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        <span>Post a letter</span>
        <button
          type="button"
          onClick={openThread}
          className="text-ink-faint underline decoration-line-bright underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
        >
          skip the game
        </button>
      </figcaption>

      <ContactDialog open={threadOpen} onClose={closeThread} />
    </figure>
  );
}
