"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  walkthrough,
  type ImageFlow,
  type ImageStep,
  type LogKind,
  type VideoFlow,
  type VideoStep,
  type WalkFlow,
} from "@/lib/content/client-work";
import { useMotionEnabled } from "@/lib/motion/use-motion-enabled";

/*
  The product walkthrough. Video flows play an edited screen recording of the staging build
  and switch the server trace as the video crosses each step's timestamp; the step rail fills
  in real time and seeks on click. Image flows show single frames with a CSS cursor and the
  same trace. With motion allowed the tour plays itself while on screen and moves on to the
  next role when a flow ends; with reduced motion nothing plays until the visitor asks.
  Without JavaScript the <noscript> block lists every video (native controls) and trace.
*/

const IMAGE_BASE_MS = 3600;
const IMAGE_PER_LINE_MS = 520;
const imageStepMs = (step: ImageStep) => IMAGE_BASE_MS + step.log.length * IMAGE_PER_LINE_MS;

const kindLabel: Record<LogKind, string> = {
  req: "req",
  auth: "auth",
  perm: "perm",
  scope: "scope",
  check: "check",
  db: "sql",
  audit: "audit",
  res: "res",
  deny: "deny",
  note: "note",
};

const kindTone: Record<LogKind, string> = {
  req: "text-accent",
  auth: "text-ink-dim",
  perm: "text-ink-dim",
  scope: "text-ink-dim",
  check: "text-ink-dim",
  db: "text-ink-dim",
  audit: "text-redline",
  res: "text-accent",
  deny: "text-redline",
  note: "text-ink-faint",
};

const stepIndexAt = (flow: VideoFlow, t: number) => {
  let index = 0;
  flow.steps.forEach((step, i) => {
    if (t + 0.05 >= step.at) index = i;
  });
  return index;
};

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

/*
  Marks a horizontal scroller with data-fade-start / data-fade-end while content is hidden
  past that edge, so CSS can fade the edge as a "there is more" cue. Written to the DOM
  directly: scrolling should never re-render React.
*/
function useEdgeFade(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      const hidden = node.scrollWidth - node.clientWidth;
      node.toggleAttribute("data-fade-start", node.scrollLeft > 1);
      node.toggleAttribute("data-fade-end", hidden - node.scrollLeft > 1);
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    // Tabs change width when the webfont lands, which moves scrollWidth without resizing the list.
    const observer = new ResizeObserver(update);
    observer.observe(node);
    for (const child of Array.from(node.children)) observer.observe(child);
    return () => {
      node.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [ref]);
}

export function Walkthrough() {
  const motion = useMotionEnabled(0);
  const [flowIndex, setFlowIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [wantsPlay, setWantsPlay] = useState<boolean | null>(null);
  const [inView, setInView] = useState(false);
  const [near, setNear] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  // True after a visitor moves the tour, false once it moves itself: only their own
  // changes are announced, so autoplay doesn't talk over the page every few seconds.
  const [userDriven, setUserDriven] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  useEdgeFade(tabListRef);

  // Autoplay by default only where motion is allowed; reduced motion waits for a click.
  const playing = (wantsPlay ?? motion) && inView;

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), {
      threshold: 0.3,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // The recording only starts fetching metadata once the section is a screen or so away,
  // so a visitor who never scrolls here downloads nothing but the poster. Set once, kept.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Keep the active tab in view inside its own scroller, without moving the page.
  useEffect(() => {
    const tab = tabRefs.current[flowIndex];
    const list = tab?.parentElement;
    if (!tab || !list || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: tab.offsetLeft - 20, behavior: motion ? "smooth" : "auto" });
  }, [flowIndex, motion]);

  const flow = walkthrough[flowIndex] ?? walkthrough[0];

  // Drive the video from state.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || flow?.kind !== "video") return;
    if (playing) void video.play().catch(() => setVideoPlaying(false));
    else video.pause();
  }, [playing, flow, flowIndex]);

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

  const goTo = useCallback((nextFlow: number, nextStep: number) => {
    setFlowIndex(nextFlow);
    setStepIndex(nextStep);
  }, []);

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
    setUserDriven(true);
    goTo(target, 0);
    tabRefs.current[target]?.focus();
  };

  const step = flow.steps[stepIndex] ?? flow.steps[0];
  if (!step) return null;
  const stepKey = `${flow.id}-${stepIndex}`;
  const isPlaying = flow.kind === "video" ? videoPlaying : playing;
  const activeImageStep = flow.kind === "images" ? flow.steps[stepIndex] : undefined;

  return (
    <div ref={rootRef} className="walk mt-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        {/* The vertical padding keeps focus rings clear of the scroller's clipping edge. */}
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Walkthrough, one flow per role"
          onKeyDown={onTabKey}
          className="walk-tabs -mx-5 -my-1 flex gap-1.5 overflow-x-auto px-5 py-1 sm:-mx-1 sm:px-1"
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
                ) : null}
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <ControlButton label="Previous step" onClick={() => byUser(retreat)}>
            <path d="M9.5 3.5 5 8l4.5 4.5" />
          </ControlButton>
          <ControlButton
            label={isPlaying ? "Pause the walkthrough" : "Play the walkthrough"}
            onClick={() => byUser(() => setWantsPlay(!isPlaying))}
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
              preload={near ? "metadata" : "none"}
              playing={videoPlaying}
              onPlayingChange={setVideoPlaying}
              onClockStep={followClock}
              onSeekStep={(index) => setStepIndex((current) => (current === index ? current : index))}
              onEnded={() => {
                if (!(wantsPlay ?? motion)) return;
                setUserDriven(false);
                nextFlow();
              }}
              onPlayRequest={() => byUser(() => setWantsPlay(true))}
            />
          ) : (
            <ImageStage flow={flow} stepIndex={stepIndex} stepKey={stepKey} />
          )}

          {/*
            Step rail. Video: the active segment fills from the video clock. Images: it is the
            tour's clock. Each button is a 44px touch target around a 2px bar.
          */}
          <div className="flex gap-1 border-t border-line px-3 py-1 sm:py-2.5">
            {flow.steps.map((item, index) => {
              const state = index < stepIndex ? "done" : index === stepIndex ? "active" : "todo";
              return (
                <button
                  key={item.title}
                  type="button"
                  aria-label={`Step ${index + 1} of ${flow.steps.length}: ${item.title}`}
                  aria-current={index === stepIndex ? "step" : undefined}
                  onClick={() => byUser(() => seekStep(index))}
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
                      ) : playing && activeImageStep ? (
                        <span
                          key={stepKey}
                          className="walk-progress absolute inset-0 bg-accent"
                          data-paused={hovering ? "" : undefined}
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

        <Trace flow={flow} stepIndex={stepIndex} announce={userDriven} />
      </div>

      <noscript>
        <StaticWalkthrough />
      </noscript>
    </div>
  );
}

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
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

/*
  A screen recording. The step follows the video clock; a play button covers it while paused.
  The poster always shows; `preload` only decides whether metadata is fetched ahead of a
  click, and play() still works from "none".
*/
function VideoStage({
  flow,
  videoRef,
  preload,
  playing,
  onPlayingChange,
  onClockStep,
  onSeekStep,
  onEnded,
  onPlayRequest,
}: {
  flow: VideoFlow;
  videoRef: RefObject<HTMLVideoElement | null>;
  preload: "none" | "metadata";
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  onClockStep: (index: number) => void;
  onSeekStep: (index: number) => void;
  onEnded: () => void;
  onPlayRequest: () => void;
}) {
  return (
    <div className="relative bg-[#f5f4f0]" style={{ aspectRatio: `${flow.frame.width} / ${flow.frame.height}` }}>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-top"
        src={flow.video.src}
        poster={flow.video.poster}
        muted
        playsInline
        preload={preload}
        aria-label={flow.video.description}
        onPlay={() => onPlayingChange(true)}
        onPause={() => onPlayingChange(false)}
        onTimeUpdate={(event) => onClockStep(stepIndexAt(flow, event.currentTarget.currentTime))}
        onSeeked={(event) => onSeekStep(stepIndexAt(flow, event.currentTarget.currentTime))}
        onEnded={() => {
          onPlayingChange(false);
          onEnded();
        }}
      />
      {playing ? null : (
        <button
          type="button"
          onClick={() => {
            onPlayRequest();
            void videoRef.current?.play().catch(() => undefined);
          }}
          // Inset ring: the frame clips anything drawn outside it.
          className={`walk-play absolute inset-0 flex items-center justify-center bg-[#0b0e13]/25 transition-colors duration-200 hover:bg-[#0b0e13]/35 focus-visible:-outline-offset-4 ${focusRing}`}
          aria-label={`Play: ${flow.label} walkthrough`}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-ground shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)]">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="ml-1 h-6 w-6 fill-current">
              <path d="M4 2.5v11l9-5.5z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}

/* Still frames: every frame stacked, the active one shown, a CSS cursor gliding to its target. */
function ImageStage({ flow, stepIndex, stepKey }: { flow: ImageFlow; stepIndex: number; stepKey: string }) {
  const step = flow.steps[stepIndex] ?? flow.steps[0];
  if (!step) return null;
  const point = { left: `${step.cursor.x}%`, top: `${step.cursor.y}%` };
  return (
    <div className="walk-stage relative overflow-hidden bg-[#f5f4f0]" style={{ aspectRatio: `${flow.frame.width} / ${flow.frame.height}` }}>
      {flow.steps.map((item, index) => {
        const active = index === stepIndex;
        return (
          <div key={`${flow.id}-${index}`} className="walk-shot absolute inset-0" data-active={active ? "" : undefined} aria-hidden={active ? undefined : true}>
            <Image
              src={item.image}
              alt={active ? item.alt : ""}
              fill
              quality={90}
              sizes="(min-width: 1152px) 780px, (min-width: 1024px) 66vw, 100vw"
              className="object-cover object-top"
            />
          </div>
        );
      })}
      <span aria-hidden="true" className="walk-cursor absolute z-10" style={point}>
        <svg viewBox="0 0 20 22" className="h-5 w-5 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]">
          <path d="M2 1.5v16.2l4.3-4.1 2.9 6.6 2.7-1.2-2.8-6.5h6.1z" fill="#fff" stroke="#11151c" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </span>
      {step.click ? <span key={`${stepKey}-click`} aria-hidden="true" className="walk-click absolute z-10" style={point} /> : null}
    </div>
  );
}

/*
  What the step means, and the trace of what the server did.

  Every step of the flow is rendered into the same grid cell and only the active one is
  visible, so the panel is always as tall as the flow's longest step: stepping never moves
  the page, and a short flow doesn't leave a void. Only the active layer carries the
  animation classes, so each step's heading and log replay as it becomes active.
*/
function Trace({ flow, stepIndex, announce }: { flow: WalkFlow; stepIndex: number; announce: boolean }) {
  const steps: ReadonlyArray<VideoStep | ImageStep> = flow.steps;
  const active = steps[stepIndex];
  return (
    <aside className="flex flex-col border border-line bg-surface">
      {/* One persistent live region: the layers below swap visibility, which screen readers don't announce reliably. */}
      <p className="sr-only" aria-live={announce ? "polite" : "off"} aria-atomic="true">
        {active ? `Step ${stepIndex + 1} of ${steps.length}: ${active.title}` : ""}
      </p>
      <div className="grid flex-1">
        {steps.map((step, index) => (
          <TraceStep
            key={`${flow.id}-${index}`}
            flowLabel={flow.label}
            step={step}
            index={index}
            total={steps.length}
            active={index === stepIndex}
          />
        ))}
      </div>
    </aside>
  );
}

function TraceStep({
  flowLabel,
  step,
  index,
  total,
  active,
}: {
  flowLabel: string;
  step: VideoStep | ImageStep;
  index: number;
  total: number;
  active: boolean;
}) {
  const enter = active ? "walk-in" : "";
  return (
    <div
      className={`flex flex-col [grid-area:1/1] ${active ? "" : "invisible"}`}
      aria-hidden={active ? undefined : true}
    >
      <div className={`px-5 pt-5 ${enter}`}>
        <p className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          <span>{flowLabel}</span>
          <span className="tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </p>
        <h4 className="mt-2 font-display text-lg leading-snug tracking-tight text-ink">{step.title}</h4>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">{step.detail}</p>
      </div>

      <div className="mt-4 flex flex-1 flex-col border-t border-line bg-ground px-4 py-3.5">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full bg-accent ${active ? "walk-live" : ""}`} />
          Server trace
        </p>
        <ol className="mt-2.5 flex flex-col gap-1.5" aria-label="What the server does for this step">
          {step.log.map((line, lineIndex) => (
            <li
              key={line.text}
              className={`grid grid-cols-[3rem_minmax(0,1fr)] gap-2 font-mono text-[11px] leading-[1.5] ${active ? "walk-line" : ""} ${line.kind === "note" ? "italic" : ""}`}
              style={{ "--i": lineIndex } as CSSProperties}
            >
              <span className={`uppercase tracking-[0.08em] ${kindTone[line.kind]}`}>{kindLabel[line.kind]}</span>
              <span className={line.kind === "note" ? "text-ink-faint" : "text-ink"}>{line.text}</span>
            </li>
          ))}
        </ol>
        <div className={`mt-auto flex flex-wrap gap-1.5 pt-4 ${enter}`}>
          {step.tech.map((item) => (
            <span key={item} className="border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-dim">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* No JavaScript: every recording with native controls, every frame, every trace. */
function StaticWalkthrough() {
  return (
    <div className="mt-8 flex flex-col gap-12">
      {walkthrough.map((flow) => (
        <section key={flow.id} aria-label={flow.label}>
          <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">{flow.label}</h4>
          <p className="mt-2 max-w-[68ch] text-[14px] leading-relaxed text-ink-dim">{flow.summary}</p>
          {flow.kind === "video" ? (
            <video
              className="mt-4 block h-auto w-full border border-line"
              src={flow.video.src}
              poster={flow.video.poster}
              controls
              muted
              playsInline
              preload="none"
              aria-label={flow.video.description}
              width={flow.frame.width}
              height={flow.frame.height}
            />
          ) : null}
          <ol className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {flow.steps.map((step, index) => (
              <li key={`${flow.id}-${index}`} className="border border-line bg-surface">
                {"image" in step ? (
                  <Image
                    src={step.image}
                    alt={step.alt}
                    width={flow.frame.width}
                    height={flow.frame.height}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="block h-auto w-full border-b border-line"
                  />
                ) : null}
                <div className="px-4 py-4">
                  <p className="font-display text-base text-ink">
                    {"at" in step ? <span className="mr-2 font-mono text-[11px] text-ink-faint">{Math.floor(step.at)}s</span> : null}
                    {step.title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">{step.detail}</p>
                  <ul className="mt-3 flex flex-col gap-1 font-mono text-[11px] text-ink-dim">
                    {step.log.map((line) => (
                      <li key={line.text}>
                        <span className={kindTone[line.kind]}>{kindLabel[line.kind]}</span> {line.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
