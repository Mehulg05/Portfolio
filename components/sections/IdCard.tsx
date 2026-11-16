"use client";

import { useEffect, useRef, useState } from "react";
import type { Milestone } from "@/lib/content/milestones";
import { CLIP_DEPTH, STRAP_WIDTH } from "@/lib/motion/lanyard-geometry";
import { useLanyard } from "@/lib/motion/use-lanyard";
import {
  CardFace,
  HOLDER_H,
  HOLDER_W,
  Holder,
  tones,
} from "@/components/sections/IdCardStatic";

/*
  The ID card hanging beside the timeline. One lanyard from the top of the viewport,
  one card. When the milestone changes the holder flips edge-on with the card in it,
  the face swaps, and it flips back — so two cards are never visible at once. The
  lanyard is a simulated strap
  (see use-lanyard): scrolling jolts the card, and it can be picked up and pulled.
  Desktop and motion only (the parent gates on useMotionEnabled).

  The look: a woven strap with stitched edges and the name printed along it, ending
  in a metal crimp and a swivel ring hooked through the slot of a clear vinyl badge
  holder, with the PVC card sitting inside it.
*/

/** The sticky column's top offset: the strap runs from the viewport top to the hook. */
const LANYARD = 112;
/** Printed along the strap; long enough to cover it at any stretch. */
const STRAP_TEXT = "MEHUL GUPTA · ".repeat(6);

type Phase = "idle" | "out" | "in";

/** One half-turn; keep in step with the idcard keyframes in styles/idcard.css. */
const FLIP_HALF_MS = 230;

type Props = {
  milestone: Milestone;
  /** +1 when the visitor scrolled down into this step, -1 when up. */
  direction: 1 | -1;
};

export function IdCard({ milestone, direction }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const strapRef = useRef<SVGPathElement>(null);
  const edgesRef = useRef<SVGPathElement>(null);
  const hardwareRef = useRef<SVGGElement>(null);
  const [shown, setShown] = useState(milestone);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pendingId, setPendingId] = useState<string | null>(null);

  useLanyard(
    frameRef,
    bodyRef,
    { strap: strapRef, edges: edgesRef, hardware: hardwareRef },
    { length: LANYARD, width: HOLDER_W, height: HOLDER_H },
  );

  // A new step arrived: start turning the card away. If the step changes again
  // mid-turn we simply retarget; the animationend handler reads the latest prop.
  if (milestone.id !== shown.id && pendingId !== milestone.id) {
    setPendingId(milestone.id);
    setPhase("out");
  }

  const advance = () => {
    if (phase === "out") {
      setShown(milestone);
      setPhase("in");
    } else if (phase === "in") {
      setPhase("idle");
      setPendingId(null);
    }
  };

  // Safety net: if animationend never arrives (a hot reload mid-turn, a background
  // tab), the card would be stuck edge-on and invisible. Advance anyway a beat after
  // the animation should have finished. Cleared as soon as the phase moves on.
  useEffect(() => {
    if (phase === "idle") return;
    const timer = window.setTimeout(advance, FLIP_HALF_MS + 120);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-arm on phase only
  }, [phase]);

  const flipClass =
    phase === "idle"
      ? ""
      : `idcard-${phase}-${direction === 1 ? "forward" : "back"}`;

  const { card } = shown;

  const straight = `M${HOLDER_W / 2} ${-LANYARD} L${HOLDER_W / 2} 0`;

  return (
    <div
      ref={frameRef}
      className="relative"
      style={{ width: HOLDER_W, height: HOLDER_H, perspective: "1200px" }}
    >
      {/*
        The strap. Drawn in the frame's coordinate space (overflow visible, so it can
        reach above the card to the viewport top); painted by the sim every frame. It
        sits behind the holder so a slack loop hides under it.
      */}
      <svg
        aria-hidden="true"
        width={HOLDER_W}
        height={HOLDER_H}
        className="pointer-events-none absolute top-0 left-0 overflow-visible"
      >
        <defs>
          <pattern
            id="idcard-weave"
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="4" height="4" fill="#3a5490" />
            <rect width="2" height="4" fill="#2c4374" />
          </pattern>
        </defs>
        {/* Woven strap: shadowed underside, the weave, then stitching and the print. */}
        <path
          ref={strapRef}
          id="idcard-strap"
          d={straight}
          fill="none"
          stroke="url(#idcard-weave)"
          strokeWidth={STRAP_WIDTH}
          strokeLinecap="butt"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.6))" }}
        />
        <path
          ref={edgesRef}
          d={`${straight} ${straight}`}
          fill="none"
          stroke="rgba(255,255,255,0.38)"
          strokeWidth={0.8}
          strokeDasharray="2.5 1.8"
          strokeLinejoin="round"
        />
        <text
          fill="rgba(255,255,255,0.7)"
          fontSize="5.5"
          fontFamily="var(--font-mono, ui-monospace, monospace)"
          fontWeight="600"
          letterSpacing="0.9"
          dominantBaseline="central"
          textAnchor="start"
        >
          <textPath href="#idcard-strap" startOffset="0">
            {STRAP_TEXT}
          </textPath>
        </text>
      </svg>

      {/* The body the sim moves: the holder with the card in it, rotating about its centre. */}
      <div
        ref={bodyRef}
        className="relative origin-center will-change-transform"
        style={{ width: HOLDER_W, height: HOLDER_H }}
      >
        {/* The flip turns the whole pouch, card inside, about its vertical centre line. */}
        <div className="h-full w-full" style={{ perspective: "900px" }}>
          <div onAnimationEnd={advance} className={`relative h-full w-full ${flipClass}`}>
            <Holder>
              <div
                className={`idcard-plastic relative h-[312px] w-[208px] overflow-hidden rounded-lg ${tones[card.tone]}`}
              >
                <CardFace milestone={shown} />
              </div>
            </Holder>
          </div>
        </div>
      </div>

      {/* Crimp and swivel ring, above the holder so the ring shows over the slot. */}
      <svg
        aria-hidden="true"
        width={HOLDER_W}
        height={HOLDER_H}
        className="pointer-events-none absolute top-0 left-0 overflow-visible"
      >
        <g ref={hardwareRef} transform={`translate(${HOLDER_W / 2} ${CLIP_DEPTH})`}>
          <Hardware />
        </g>
      </svg>
    </div>
  );
}

/*
  Metal fittings at the strap's end, drawn around the point where the ring meets the
  card's slot, local +y running along the strap towards the card: a crimp that the strap
  disappears into, then a swivel ring through the slot. Brushed steel from a gradient.
*/
function Hardware() {
  return (
    <>
      <defs>
        <linearGradient id="idcard-steel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6b7480" />
          <stop offset="0.25" stopColor="#e6eaef" />
          <stop offset="0.5" stopColor="#9aa3ae" />
          <stop offset="0.75" stopColor="#f2f4f7" />
          <stop offset="1" stopColor="#5f6874" />
        </linearGradient>
      </defs>
      {/* Crimp */}
      <rect x={-8.5} y={-20} width={17} height={11} rx={1.5} fill="url(#idcard-steel)" stroke="rgba(0,0,0,0.55)" strokeWidth={0.6} />
      <rect x={-7} y={-17} width={14} height={0.9} fill="rgba(0,0,0,0.35)" />
      <rect x={-7} y={-13.5} width={14} height={0.9} fill="rgba(0,0,0,0.35)" />
      {/* Ring, through the slot */}
      <ellipse cx={0} cy={-3} rx={6} ry={7.5} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={3.8} />
      <ellipse cx={0} cy={-3} rx={6} ry={7.5} fill="none" stroke="url(#idcard-steel)" strokeWidth={2.5} />
    </>
  );
}

