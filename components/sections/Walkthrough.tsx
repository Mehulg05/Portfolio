"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { walkthrough } from "@/lib/content/client-work";
import { useMotionEnabled } from "@/lib/motion/use-motion-enabled";
import { ImageStage } from "./walkthrough/ImageStage";
import { StaticWalkthrough } from "./walkthrough/StaticWalkthrough";
import { Trace } from "./walkthrough/Trace";
import { VideoStage } from "./walkthrough/VideoStage";
import {
  TAB_EDGE_FADE_PX,
  useDataSaver,
  useEdgeFade,
  usePageVisible,
  useSectionVisibility,
} from "./walkthrough/hooks";
import { focusRing, imageStepMs } from "./walkthrough/shared";

/*
  The product walkthrough. Video flows play an edited screen recording of the staging build
  and switch the server trace as the video crosses each step's timestamp; the step rail fills
  in real time and seeks on click. Image flows show single frames with a CSS cursor and the
  same trace. With motion allowed the tour plays itself while on screen and moves on to the
  next role when a flow ends; with reduced motion nothing plays until the visitor asks.

  The tour holds while the pointer is over it or keyboard focus is inside it, and while the
  tab is hidden. Without JavaScript the interactive shell is hidden and the <noscript> block
  lists every video (native controls) and trace.

  Pieces live in ./walkthrough: VideoStage, ImageStage, Trace, the static fallback, hooks.
*/

type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

export function Walkthrough() {
  const motion = useMotionEnabled(0);
  const dataSaver = useDataSaver();
  const pageVisible = usePageVisible();
  const [flowIndex, setFlowIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [wantsPlay, setWantsPlay] = useState<boolean | null>(null);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  // True after a visitor moves the tour, false once it moves itself: only their own
  // changes are announced, so autoplay doesn't talk over the page every few seconds.
  const [userDriven, setUserDriven] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const railRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const railFocus = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);

  useEdgeFade(tabListRef);
  const { inView, near } = useSectionVisibility(rootRef);

  // Autoplay by default only where motion is allowed and the visitor has not asked to save
  // data; reduced motion and data-saver wait for a click.
  const tourOn = wantsPlay ?? (motion && !dataSaver);
  const playing = tourOn && inView && pageVisible;
  // Pointer or keyboard focus on the tour: it stays where it is and never moves on by itself.
  const held = hovering || focusWithin;

  // Keep the active tab in view inside its own scroller, without moving the page.
  useEffect(() => {
    const tab = tabRefs.current[flowIndex];
    const list = tab?.parentElement;
    if (!tab || !list || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: tab.offsetLeft - TAB_EDGE_FADE_PX - 8, behavior: motion ? "smooth" : "auto" });
  }, [flowIndex, motion]);

  const flow = walkthrough[flowIndex] ?? walkthrough[0];

  // Drive the video from state.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || flow?.kind !== "video") return;
    if (playing) {
      void video.play().catch(() => {
        // Refused (Low Power Mode, blocked autoplay): show Play and let a click retry.
        setVideoPlaying(false);
        setWantsPlay(false);
      });
    } else video.pause();
  }, [playing, flow]);

  // Fill the active rail segment from the video clock, without re-rendering React.
  useEffect(() => {
    if (flow?.kind !== "video" || !videoPlaying) return;
    let frame = 0;
    const tick = () => {
      const video = videoRef.current;
      const fill = fillRef.current;
      if (video && fill) {
        const step = flow.steps[stepIndex];
        const next = flow.steps[stepIndex + 1]?.at ?? flow.video.seconds;
        if (step) fill.style.transform = `scaleX(${Math.min(1, Math.max(0, (video.currentTime - step.at) / Math.max(0.1, next - step.at)))})`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [flow, stepIndex, videoPlaying]);

  // A flow with fewer steps removes the rail button that had focus; put focus on the nearest
  // one rather than letting it fall to <body>.
  useEffect(() => {
    const remembered = railFocus.current;
    if (remembered === null || document.activeElement !== document.body) return;
    const count = walkthrough[flowIndex]?.steps.length ?? 0;
    railRefs.current[Math.min(remembered, count - 1)]?.focus();
  }, [flowIndex, stepIndex]);

  const goTo = useCallback((nextFlow: number, nextStep: number) => {
    setFlowIndex(nextFlow);
    setStepIndex(nextStep);
  }, []);

  const focusPlayButton = useCallback(() => playButtonRef.current?.focus(), []);

  if (!flow) return null;

  const nextFlow = () => goTo((flowIndex + 1) % walkthrough.length, 0);

  const seekStep = (index: number) => {
    if (flow.kind === "video") {
      const step = flow.steps[index];
      const video = videoRef.current;
      if (step && video) video.currentTime = step.at + 0.01;
    }
    setStepIndex(index);
  };

  const advance = () => {
    if (stepIndex < flow.steps.length - 1) seekStep(stepIndex + 1);
    else nextFlow();
  };
  const retreat = () => {
    if (stepIndex > 0) seekStep(stepIndex - 1);
    else {
      const previous = (flowIndex - 1 + walkthrough.length) % walkthrough.length;
      goTo(previous, 0);
    }
  };

  // Every handler a visitor can trigger goes through `byUser`; the tour's own clock doesn't.
  const byUser = (action: () => void) => {
    setUserDriven(true);
    action();
  };
  const autoAdvance = () => {
    setUserDriven(false);
    advance();
  };
  // Video steps follow the clock. A seek lands on the step the visitor picked, so only a
  // clock tick that crosses into a new step counts as the tour moving itself.
  const followClock = (index: number) => {
    if (index === stepIndex) return;
    setUserDriven(false);
    setStepIndex(index);
  };

  // Called straight from the click, not through state: when the browser refused the first
  // play(), `playing` is already true and an effect keyed on it would never run again.
  const togglePlayback = () => {
    const video = videoRef.current;
    if (flow.kind === "video" && video) {
      if (video.paused) {
        setWantsPlay(true);
        void video.play().catch(() => setWantsPlay(false));
      } else {
        setWantsPlay(false);
        video.pause();
      }
      return;
    }
    setWantsPlay(!(tourOn && playing));
  };

  const enterFullscreen = () => {
    const video: FullscreenVideo | null = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) void video.requestFullscreen().catch(() => undefined);
    else video.webkitEnterFullscreen?.();
  };

  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = walkthrough.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: flowIndex === last ? 0 : flowIndex + 1,
      ArrowLeft: flowIndex === 0 ? last : flowIndex - 1,
      Home: 0,
      End: last,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    byUser(() => goTo(target, 0));
    tabRefs.current[target]?.focus();
  };

  // Only keyboard focus holds the tour: a mouse click leaves focus on the button but the
  // visitor is not "reading", and the tour should carry on to the next role.
  const onFocusIn = (event: FocusEvent<HTMLDivElement>) => {
    setFocusWithin(event.target.matches(":focus-visible"));
  };
  const onFocusOut = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false);
  };

  const stepKey = `${flow.id}-${stepIndex}`;
  const isPlaying = flow.kind === "video" ? videoPlaying : tourOn && playing;
  const activeImageStep = flow.kind === "images" ? flow.steps[stepIndex] : undefined;

  return (
    <div ref={rootRef} className="walk mt-6">
      {/* Hidden without JavaScript (the controls would do nothing); <noscript> below takes over. */}
      <div className="walk-interactive" onFocus={onFocusIn} onBlur={onFocusOut}>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          {/* The vertical padding keeps focus rings clear of the scroller's clipping edge. */}
          <div
            ref={tabListRef}
            role="tablist"
            aria-label="Walkthrough, one flow per role"
            onKeyDown={onTabKey}
            className="walk-tabs relative -mx-5 -my-1 flex gap-1.5 overflow-x-auto px-5 py-1 sm:-mx-1 sm:px-1"
          >
            {walkthrough.map((item, index) => {
              const selected = index === flowIndex;
              return (
                <button
                  key={item.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`walk-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls="walk-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => byUser(() => goTo(index, 0))}
                  className={`flex min-h-11 shrink-0 items-center gap-2 border px-3.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-offset-2 sm:min-h-10 ${focusRing} ${
                    selected
                      ? "border-accent bg-surface text-ink"
                      : "border-line text-ink-faint hover:border-line-bright hover:text-ink-dim"
                  }`}
                >
                  {item.kind === "video" ? (
                    <svg aria-hidden="true" viewBox="0 0 10 10" className="h-2 w-2 fill-current opacity-70">
                      <path d="M2 1.2v7.6L8.6 5z" />
                    </svg>
                  ) : (
                    // Stills, not a recording: stacked frames instead of the play marker.
                    <svg aria-hidden="true" viewBox="0 0 10 10" className="h-2 w-2 fill-none stroke-current opacity-70" strokeWidth="1.2">
                      <rect x="1" y="3" width="6" height="6" />
                      <path d="M3 1h6v6" />
                    </svg>
                  )}
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            {flow.kind === "video" ? (
              // The recording is landscape and its UI is tiny at phone width; full screen turns it sideways.
              <span className="sm:hidden">
                <ControlButton label="Watch the recording full screen" onClick={enterFullscreen}>
                  <path d="M3 6V3h3M10 3h3v3M13 10v3h-3M6 13H3v-3" />
                </ControlButton>
              </span>
            ) : null}
            <ControlButton label="Previous step" onClick={() => byUser(retreat)}>
              <path d="M9.5 3.5 5 8l4.5 4.5" />
            </ControlButton>
            <ControlButton
              buttonRef={playButtonRef}
              label={isPlaying ? "Pause the walkthrough" : "Play the walkthrough"}
              onClick={() => byUser(togglePlayback)}
            >
              {isPlaying ? <path d="M6 4v8M10 4v8" /> : <path d="M5.5 3.5v9l7-4.5z" />}
            </ControlButton>
            <ControlButton label="Next step" onClick={() => byUser(advance)}>
              <path d="M6.5 3.5 11 8l-4.5 4.5" />
            </ControlButton>
          </div>
        </div>

        <div
          id="walk-panel"
          role="tabpanel"
          aria-labelledby={`walk-tab-${flow.id}`}
          className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-5"
          onPointerEnter={() => setHovering(true)}
          onPointerLeave={() => setHovering(false)}
        >
          <figure className="walk-frame m-0 overflow-hidden border border-line-bright bg-surface-2">
            <div className="flex items-center gap-3 border-b border-line px-3 py-2">
              <span aria-hidden="true" className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-line-bright" />
                <span className="h-2 w-2 rounded-full bg-line-bright" />
                <span className="h-2 w-2 rounded-full bg-line-bright" />
              </span>
              <span className="min-w-0 flex-1 truncate border border-line bg-ground px-2.5 py-1 font-mono text-[10px] text-ink-faint">
                {flow.id === "website"
                  ? "alphaacademykarnal.in · live"
                  : `staging · /portal · ${flow.actor}`}
              </span>
              {flow.kind === "video" ? (
                <span className="hidden shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint sm:flex">
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${isPlaying ? "walk-live bg-redline" : "bg-line-bright"}`} />
                  Recording
                </span>
              ) : null}
            </div>

            {flow.kind === "video" ? (
              <VideoStage
                key={flow.id}
                flow={flow}
                videoRef={videoRef}
                near={near}
                playing={videoPlaying}
                onPlayingChange={setVideoPlaying}
                onClockStep={followClock}
                onSeekStep={setStepIndex}
                onEnded={() => {
                  if (!tourOn || held) return;
                  setUserDriven(false);
                  nextFlow();
                }}
                onPlayRequest={() => byUser(() => setWantsPlay(true))}
                onFocusHandoff={focusPlayButton}
              />
            ) : (
              <ImageStage flow={flow} stepIndex={stepIndex} stepKey={stepKey} />
            )}

            {/*
              Step rail. Video: the active segment fills from the video clock. Images: it is the
              tour's clock. Each button is a 44px touch target around a 2px bar. Keyed by index so
              the buttons survive a step change (a re-keyed rail dropped keyboard focus).
            */}
            <div className="flex gap-1 border-t border-line px-3 py-1 sm:py-2.5">
              {flow.steps.map((item, index) => {
                const state = index < stepIndex ? "done" : index === stepIndex ? "active" : "todo";
                return (
                  <button
                    key={index}
                    ref={(node) => {
                      railRefs.current[index] = node;
                    }}
                    type="button"
                    aria-label={`Step ${index + 1} of ${flow.steps.length}: ${item.title}`}
                    aria-current={index === stepIndex ? "step" : undefined}
                    onClick={() => byUser(() => seekStep(index))}
                    onFocus={() => {
                      railFocus.current = index;
                    }}
                    onBlur={(event) => {
                      // A null relatedTarget can mean the button was removed, not left: keep the memory.
                      if (event.relatedTarget) railFocus.current = null;
                    }}
                    className={`group flex min-h-11 flex-1 items-center focus-visible:outline-offset-0 sm:min-h-6 ${focusRing}`}
                  >
                    <span className="relative block h-0.5 w-full overflow-hidden bg-line-bright group-hover:bg-ink-faint">
                      {state === "done" ? <span className="absolute inset-0 bg-accent/60" /> : null}
                      {state === "active" ? (
                        flow.kind === "video" ? (
                          <span
                            ref={fillRef}
                            className="absolute inset-0 origin-left bg-accent"
                            style={{ transform: videoPlaying ? undefined : "scaleX(1)" }}
                          />
                        ) : tourOn && activeImageStep ? (
                          // Stays mounted while the tour is held or off screen and pauses in
                          // place, so scrolling back does not restart the step.
                          <span
                            key={stepKey}
                            className="walk-progress absolute inset-0 bg-accent"
                            data-paused={held || !inView || !pageVisible ? "" : undefined}
                            style={{ "--step": `${imageStepMs(activeImageStep)}ms` } as CSSProperties}
                            onAnimationEnd={autoAdvance}
                          />
                        ) : (
                          <span className="absolute inset-0 bg-accent" />
                        )
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </figure>

          <Trace flow={flow} stepIndex={stepIndex} announce={userDriven} live={isPlaying} />
        </div>
      </div>

      <noscript>
        <style>{".walk-interactive{display:none}"}</style>
        <StaticWalkthrough />
      </noscript>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
  buttonRef,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center border border-line text-ink-dim transition-colors duration-200 hover:border-accent hover:text-accent focus-visible:outline-offset-2 sm:h-10 sm:w-10 ${focusRing}`}
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}
