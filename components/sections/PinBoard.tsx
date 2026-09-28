"use client";

import { useRef, type CSSProperties } from "react";
import { usePinSwing } from "@/lib/motion/use-pin-swing";
import { certifications, courseraVerify } from "@/lib/content/profile";

/*
  The certifications, pinned to a board. Each is an index card held by one pushpin at
  the top and hung a degree or two off square; on desktop it swings on the pin when
  brushed, scrolled past or dragged (use-pin-swing). Below that, and with reduced
  motion, the cards keep their tilt and stay put.
*/

/* Rest tilts, one per card, in degrees. Alternating so the row reads as hung by hand. */
const TILTS = [-1.6, 1.2, -0.9, 1.7, -1.3, 1.1];

export function PinBoard() {
  return (
    <ul className="pin-board grid grid-cols-1 gap-x-6 gap-y-7 border border-line px-5 pt-7 pb-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
      {certifications.map((item, index) => (
        <PinCard
          key={item.name}
          tilt={TILTS[index % TILTS.length]}
          kick={0.7 + ((index * 7) % 5) * 0.15}
        >
          {item.credentialId ? (
            <a
              href={`${courseraVerify}${item.credentialId}`}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              className="text-[14px] leading-snug text-ink hover:text-accent"
            >
              {item.name}
              <span aria-hidden="true"> ↗</span>
              <span className="sr-only">, verify credential</span>
            </a>
          ) : (
            <p className="text-[14px] leading-snug text-ink">{item.name}</p>
          )}
          <p className="mt-auto pt-3 font-mono text-[11px] text-ink-faint">
            {item.issuer} · {item.date}
          </p>
          {item.credentialId ? (
            <p className="mt-0.5 font-mono text-[11px] break-all text-ink-faint">ID {item.credentialId}</p>
          ) : null}
        </PinCard>
      ))}
    </ul>
  );
}

function PinCard({ tilt, kick, children }: { tilt: number; kick: number; children: React.ReactNode }) {
  const ref = useRef<HTMLLIElement>(null);
  usePinSwing(ref, { rest: tilt, pivotY: 9, kick });

  return (
    <li
      ref={ref}
      className="pin-card relative flex min-h-[120px] flex-col border border-line-bright bg-surface-2 px-5 pt-6 pb-4"
      style={{ "--tilt": `${tilt}deg` } as CSSProperties}
    >
      {/* The pin: a round head with a highlight, a hint of needle below it. */}
      <span aria-hidden="true" className="pin-needle absolute top-[9px] left-1/2 h-[7px] w-px -translate-x-1/2" />
      <span aria-hidden="true" className="pin-head absolute top-[2px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full" />
      {children}
    </li>
  );
}
