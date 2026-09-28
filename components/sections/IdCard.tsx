"use client";

import Image from "next/image";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { Milestone } from "@/lib/content/milestones";
import { CLIP_DEPTH, STRAP_WIDTH, useLanyard } from "@/lib/motion/use-lanyard";

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

const CARD_W = 208;
const CARD_H = 312;
/** The holder: a clear pouch a little wider than the card, with a tab above it for the slot. */
export const HOLDER_SIDE = 5;
const HOLDER_TOP = 18;
const HOLDER_BOTTOM = 6;
export const HOLDER_W = CARD_W + HOLDER_SIDE * 2;
export const HOLDER_H = CARD_H + HOLDER_TOP + HOLDER_BOTTOM;
/** The sticky column's top offset: the strap runs from the viewport top to the hook. */
const LANYARD = 112;
/** Printed along the strap; long enough to cover it at any stretch. */
const STRAP_TEXT = "MEHUL GUPTA · ".repeat(6);

type Phase = "idle" | "out" | "in";

/** One half-turn; keep in step with the idcard keyframes in globals.css. */
const FLIP_HALF_MS = 230;

const tones = {
  white: "bg-white text-[#1b1f27] [--card-muted:#5b6270] [--card-rule:#d9dde5]",
  paper: "bg-[#e8e3d6] text-[#1b1f27] [--card-muted:#6b6f78] [--card-rule:#c9c3b4]",
  blue: "bg-[#173063] text-[#eef2ff] [--card-muted:#9fb1e0] [--card-rule:#2b4a8c]",
  steel: "bg-[#262d3a] text-ink [--card-muted:#8c96a6] [--card-rule:#3a4353]",
  dark: "bg-ground text-ink ring-1 ring-accent/60 [--card-muted:#7a8595] [--card-rule:#232a35]",
} as const;

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
  A clear vinyl badge holder, sized to HOLDER_W x HOLDER_H, with the card placed inside
  it. The back is the pouch itself (a faint tint, a bright edge, a welded seam a few px
  in); the front is the reflection on the plastic, which the sim slides with --sheen.
  The slot is punched through the tab above the card.
*/
function Holder({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0">
      <div aria-hidden="true" className="idcard-holder-back absolute inset-0 rounded-[10px]" />
      <div className="absolute" style={{ top: HOLDER_TOP, left: HOLDER_SIDE }}>
        {children}
      </div>
      <div aria-hidden="true" className="idcard-holder-front pointer-events-none absolute inset-0 rounded-[10px]" />
      <Slot />
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

/** The slot punched through the holder's tab; the page shows through it. */
function Slot() {
  return (
    <div
      aria-hidden="true"
      className="idcard-slot absolute left-1/2 h-[5px] w-[26px] -translate-x-1/2 rounded-full bg-ground"
      style={{ top: CLIP_DEPTH - 2.5 }}
    />
  );
}

/*
  The same card, still: no lanyard, no flip, no swing. Sits under each milestone below
  lg, where the pinned column does not exist, so a phone sees every card too. The faces
  are laid out at 208 x 312; the card is drawn at that size and scaled down as a whole,
  so the type inside keeps its proportions.
*/
export function IdCardStatic({ milestone, scale = 0.75 }: { milestone: Milestone; scale?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{ width: HOLDER_W * scale, height: (HOLDER_H + 14) * scale }}
      className="relative"
    >
      <div
        style={{ transform: `scale(${scale})`, width: HOLDER_W, height: HOLDER_H + 14 }}
        className="absolute top-0 left-0 origin-top-left"
      >
        {/* A stub of strap, its crimp and the ring, so the card reads the same as the hanging one. */}
        <div className="idcard-strap-stub absolute top-0 left-1/2 h-[6px] w-[12px] -translate-x-1/2" />
        <div className="idcard-crimp absolute top-[4px] left-1/2 h-[9px] w-[15px] -translate-x-1/2 rounded-[1.5px]" />
        <div className="idcard-ring absolute top-[9px] left-1/2 h-[16px] w-[12px] -translate-x-1/2 rounded-full" />
        <div className="absolute top-[14px] left-0" style={{ width: HOLDER_W, height: HOLDER_H }}>
          <Holder>
            <div
              className={`idcard-plastic relative h-[312px] w-[208px] overflow-hidden rounded-lg ${tones[milestone.card.tone]}`}
            >
              <CardFace milestone={milestone} />
            </div>
          </Holder>
        </div>
      </div>
    </div>
  );
}

export function CardFace({ milestone }: { milestone: Milestone }) {
  if (milestone.card.face) {
    return (
      <Image
        src={milestone.card.face}
        alt=""
        fill
        sizes="208px"
        className="object-cover"
      />
    );
  }
  if (milestone.card.kind === "school") return <SchoolFace milestone={milestone} />;
  if (milestone.card.kind === "student") return <StudentFace milestone={milestone} />;
  return <GenericFace milestone={milestone} />;
}

/*
  School ID, in the format of the real card: blue header with the crest, school name
  and address; white body with the photo, name, detail rows and a principal's
  signature slot. Only details Mehul has supplied are printed.
*/
function SchoolFace({ milestone }: { milestone: Milestone }) {
  const { card } = milestone;

  return (
    <div className="flex h-full flex-col">
      <div className="bg-[#1d4fb8] px-3 pt-3 pb-2.5 text-white">
        <div className="flex items-center gap-2">
          {card.logo ? (
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white">
              <Image src={card.logo} alt="" fill sizes="44px" className="object-contain p-0.5" />
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="font-display text-[15px] leading-tight font-semibold tracking-tight">
              {card.org}
            </p>
            {card.address ? (
              <p className="mt-0.5 text-[8px] leading-snug text-white/85">{card.address}</p>
            ) : null}
          </div>
        </div>
      </div>
      {/* The curved lip under the header on the real card. */}
      <div className="h-3 bg-[#1d4fb8] [clip-path:ellipse(70%_100%_at_50%_0)]" />

      <div className="flex flex-1 flex-col items-center px-3 pt-1 pb-3">
        <div className="relative h-[96px] w-[80px] overflow-hidden rounded-sm border-2 border-[#1d4fb8] bg-black/5">
          <Image
            src={card.photo ?? "/mehul-cutout.png"}
            alt=""
            fill
            sizes="80px"
            className="object-cover object-top"
          />
        </div>
        <p className="mt-2 font-display text-[18px] leading-none font-semibold tracking-tight">
          Mehul Gupta
        </p>

        <dl className="mt-2 w-full">
          {card.fields?.map((field) => (
            <div
              key={field.label}
              className="flex justify-between gap-2 border-b border-[var(--card-rule)] py-1 text-[10px] leading-none"
            >
              <dt className="text-[var(--card-muted)]">{field.label}</dt>
              <dd className="font-medium">{field.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto flex w-full items-end justify-end pt-2 text-[9px] leading-none">
          <div className="text-center">
            <div className="mb-1 h-4 w-14 border-b border-[#1b1f27]/60" />
            <p className="text-[8px] text-[var(--card-muted)]">Principal Sign.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
  Bennett student ID, in the format of the real card: a blue side stripe with a
  chevron and vertical HOSTELLER text; white body with the crest and wordmark,
  photo, name, programme and detail rows. Phone number deliberately omitted.
*/
function StudentFace({ milestone }: { milestone: Milestone }) {
  const { card } = milestone;
  const red = card.stripe === "red";

  return (
    <div className="flex h-full">
      <div
        className={`relative w-9 shrink-0 overflow-hidden ${red ? "bg-[#c62828]" : "bg-[#1a73d9]"}`}
      >
        <div
          aria-hidden="true"
          className={`absolute -top-1 -left-3 h-20 w-20 rotate-45 border-[7px] border-t-transparent border-l-transparent ${
            red ? "border-[#7f1d1d]/70" : "border-[#0d47a1]/70"
          }`}
        />
        {card.side ? (
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 [writing-mode:vertical-rl] rotate-180 font-display text-[15px] font-semibold tracking-[0.12em] text-white/85 uppercase">
            {card.side}
          </p>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-3 pt-3 pb-3">
        {card.logo ? (
          <div className="relative mx-auto h-[46px] w-[138px]">
            <Image src={card.logo} alt="" fill sizes="138px" className="object-contain" />
          </div>
        ) : (
          <p className="text-center font-display text-[15px] font-bold tracking-tight text-[#0d3b8c]">
            {card.org}
          </p>
        )}

        <div className="relative mt-3 ml-auto h-[84px] w-[70px] overflow-hidden rounded-sm bg-black/5">
          <Image
            src={card.photo ?? "/mehul-cutout.png"}
            alt=""
            fill
            sizes="70px"
            className="object-cover object-top"
          />
        </div>

        <p
          className={`mt-3 text-right font-display text-[16px] leading-none font-bold ${
            red ? "text-[#c62828]" : "text-[#c2185b]"
          }`}
        >
          Mehul Gupta
        </p>
        {card.role ? (
          <p className="mt-1 text-right text-[7.5px] leading-tight whitespace-nowrap text-[#1b1f27]">
            {card.role}
          </p>
        ) : null}

        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-1.5 gap-y-1.5 text-[8px] leading-none">
          {card.fields?.map((field) => (
            <Fragment key={field.label}>
              <dt className="font-medium whitespace-nowrap">{field.label}</dt>
              <dd className="font-medium whitespace-nowrap">: {field.value}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </div>
  );
}

function GenericFace({ milestone }: { milestone: Milestone }) {
  const { card } = milestone;
  const accent = card.tone === "dark";

  return (
    <div className="flex h-full flex-col px-4 pt-6 pb-4">
      {/* Header strip: wordmark where a logo would be. */}
      <div className="flex items-start justify-between gap-2 border-b border-[var(--card-rule)] pb-3">
        <div>
          {card.logo ? (
            <div className="relative h-[26px] w-[108px]">
              <Image src={card.logo} alt={card.org} fill sizes="108px" className="object-contain object-left" />
            </div>
          ) : (
            <p
              className={`font-display text-[15px] leading-tight tracking-tight ${
                accent ? "text-accent" : ""
              }`}
            >
              {card.org}
            </p>
          )}
          {card.address ? (
            <p className="mt-1 font-mono text-[8px] leading-snug tracking-[0.04em] text-[var(--card-muted)]">
              {card.address}
            </p>
          ) : null}
        </div>
        <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--card-muted)]">
          {card.kind === "school"
            ? "School ID"
            : card.kind === "student"
              ? "Student ID"
              : card.kind === "corporate"
                ? "Access"
                : "Employee"}
        </p>
      </div>

      {/* Photo */}
      {/*
        The cutout has a feathered bottom edge; scaling it up from the top pushes
        that edge out of the frame so the photo sits cleanly on a flat backdrop.
      */}
      <div className="relative mt-4 h-[124px] w-[104px] overflow-hidden rounded-sm bg-[#dfe3ea]">
        <Image
          src={card.photo ?? "/mehul-cutout.png"}
          alt=""
          fill
          sizes="104px"
          className="origin-top scale-[1.18] object-cover object-top"
        />
      </div>

      {/* Identity */}
      <p className="mt-4 font-display text-[22px] leading-none tracking-tight">Mehul Gupta</p>
      {card.role ? (
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--card-muted)]">
          {card.role}
        </p>
      ) : null}

      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          {card.fields?.map((field) => (
            <p key={field.label} className="font-mono text-[11px] tabular-nums">
              <span className="text-[9px] uppercase tracking-[0.14em] text-[var(--card-muted)]">
                {field.label}{" "}
              </span>
              {field.value}
            </p>
          ))}
          {card.period !== false ? (
            <p className="font-mono text-[11px] tabular-nums">{milestone.period}</p>
          ) : null}
        </div>
        {card.tag ? (
          <span
            className={`rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] ${
              accent
                ? "bg-accent text-ground"
                : "bg-[var(--card-rule)] text-current"
            }`}
          >
            {card.tag}
          </span>
        ) : null}
      </div>

      {/* Decorative stripe — texture, not a readable barcode. */}
      <div
        aria-hidden="true"
        className="mt-3 h-4 w-full opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 5px, currentColor 5px 6px, transparent 6px 10px, currentColor 10px 13px, transparent 13px 16px)",
        }}
      />
    </div>
  );
}
