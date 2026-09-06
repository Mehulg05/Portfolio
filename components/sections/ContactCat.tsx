"use client";

import {
  Alignment,
  Fit,
  Layout,
  RuntimeLoader,
  useRive,
  useStateMachineInput,
} from "@rive-app/react-canvas-lite";
import { useCallback } from "react";
import { profile } from "@/lib/content/profile";

/*
  Serve the wasm from our own origin. Left alone, the runtime fetches it from unpkg.com
  — the only third-party runtime request this site would make, and a silent failure
  point if that CDN is slow or blocked. scripts/copy-rive-wasm.mjs puts the matching
  binary in /public at build time.

  This is the "lite" runtime: ~339 KB gzipped against ~765 KB for the full build. It
  drops text rendering, which this file does not use.
*/
RuntimeLoader.setWasmUrl("/rive.wasm");

/*
  "Contact Cat" by hello174 — Rive Community, CC BY.
  https://rive.app/marketplace/3977-8283-contact-cat/

  The file ships two state machines; "State Machine 1" is the one carrying all four
  inputs listed on the marketplace page (ringMode, defaultMode, contactOn, phonePress).

  This is loaded only by ContactCatFrame, behind an IntersectionObserver, so the Rive
  runtime never touches the initial page load.
*/
const STATE_MACHINE = "State Machine 1";

/*
  The one number that controls the crop. 1 = the full artboard, undistorted, with all
  its empty margin. Raised past 1, the canvas — sized to the artboard's own aspect
  ratio below — is scaled up around its own center and the overflow is clipped by the
  frame, so this can never crop past the edge of what Contain already guaranteed is
  fully visible. 1.5 is a conservative first pass; tune this one line to taste.
*/
const ZOOM = 1.5;

/**
 * Rive inputs come back as booleans or triggers depending on how the author wired them,
 * and this file is somebody else's. Rather than assume, fire it if it's a trigger and
 * set it if it isn't — so a change in the source file can't silently break the hover.
 */
type RiveInput = { value?: boolean; fire?: () => void } | null;

function apply(input: RiveInput, value: boolean) {
  if (!input) return;
  if (typeof input.fire === "function" && typeof input.value !== "boolean") {
    if (value) input.fire();
    return;
  }
  input.value = value;
}

export default function ContactCat({ onAnswer }: { onAnswer?: () => void }) {
  // Reduced motion: the cat is drawn but never animates itself.
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const { rive, RiveComponent } = useRive({
    src: "/contact-cat.riv",
    stateMachines: STATE_MACHINE,
    autoplay: !reduced,
    /*
      Contain, at the artboard's own ratio (1500x700 — confirmed by reading
      rive.bounds() at runtime, not guessed). Cover was tried first and clipped the
      phone off the right edge: the frame's assumed ratio didn't match the artboard's
      real one, so Cover over-scaled and cropped further than intended. Contain at the
      true ratio guarantees the whole drawing is always on screen; ZOOM below (a plain
      CSS scale, not a Rive fit mode) is what actually tightens the crop, so the crop
      amount is one number instead of a fit-mode guess.
    */
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });

  const ringMode = useStateMachineInput(rive, STATE_MACHINE, "ringMode") as RiveInput;
  const contactOn = useStateMachineInput(rive, STATE_MACHINE, "contactOn") as RiveInput;
  const phonePress = useStateMachineInput(rive, STATE_MACHINE, "phonePress") as RiveInput;

  const startRinging = useCallback(() => {
    if (reduced) return;
    apply(ringMode, true);
    apply(contactOn, true);
  }, [reduced, ringMode, contactOn]);

  const stopRinging = useCallback(() => {
    if (reduced) return;
    apply(ringMode, false);
    apply(contactOn, false);
  }, [reduced, ringMode, contactOn]);

  /*
    The cat answering the phone IS the affordance, so the click opens the form rather
    than handing the visitor off to a mail client. The mailto stays on the element as
    the href: without JavaScript, or if the dialog chunk never lands, the click still
    does the thing the link promises.
  */
  const answer = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!reduced) apply(phonePress, true);
      if (!onAnswer) return;

      // Leave the modified clicks alone — those are the visitor asking for a new tab.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      event.preventDefault();
      onAnswer();
    },
    [reduced, phonePress, onAnswer],
  );

  return (
    /*
      A real mail link, not a div with a click handler — so it is keyboard reachable,
      announces itself properly, and still works if the runtime never loads.
    */
    <a
      href={`mailto:${profile.email}`}
      aria-label={`Start a thread with ${profile.name}`}
      aria-haspopup={onAnswer ? "dialog" : undefined}
      onMouseEnter={startRinging}
      onMouseLeave={stopRinging}
      onFocus={startRinging}
      onBlur={stopRinging}
      onClick={answer}
      className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      {/*
        The cat is drawn in dark navy on white. On this near-black sheet it would
        disappear, so it sits on a lit plate — the same "mounted print" device the
        rest of the page uses, rather than a colour invented for one component.
      */}
      {/* Sizing is duplicated in ContactCatFrame's Plate — keep the two in step. */}
      <div className="tick-frame max-w-[440px] overflow-hidden border border-line bg-[#e6eaf2] p-2">
        <RiveComponent
          className="aspect-[1500/700] w-full"
          style={{ transform: `scale(${ZOOM})` }}
        />
      </div>
    </a>
  );
}
