"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { VideoFlow } from "@/lib/content/client-work";
import { focusRing, stepIndexAt } from "./shared";

/*
  A screen recording. The step follows the video clock; a play button covers it while paused.

  The poster is only set once the section is near (see useSectionVisibility), so a visitor
  who never scrolls here does not pay for it. `preload` decides whether metadata is fetched
  ahead of a click, and play() still works from "none".

  The overlay button stays mounted while the video plays, inert and invisible, instead of
  unmounting: a keyboard user who tabbed onto it would otherwise lose focus to <body> the
  moment playback started. If it held focus, focus is handed to the toolbar's Play button.
*/
export function VideoStage({
  flow,
  videoRef,
  near,
  playing,
  onPlayingChange,
  onClockStep,
  onSeekStep,
  onEnded,
  onPlayRequest,
  onFocusHandoff,
}: {
  flow: VideoFlow;
  videoRef: RefObject<HTMLVideoElement | null>;
  near: boolean;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  onClockStep: (index: number) => void;
  onSeekStep: (index: number) => void;
  onEnded: () => void;
  onPlayRequest: () => void;
  onFocusHandoff: () => void;
}) {
  const overlayRef = useRef<HTMLButtonElement>(null);

  // Switching flows unmounts this <video> mid-play, and its pause event never reaches React,
  // so report "not playing" on the way out or the toolbar stays stuck on Pause.
  useEffect(() => () => onPlayingChange(false), [onPlayingChange]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (playing && overlay && document.activeElement === overlay) onFocusHandoff();
  }, [playing, onFocusHandoff]);

  return (
    <div className="relative bg-[#f5f4f0]" style={{ aspectRatio: `${flow.frame.width} / ${flow.frame.height}` }}>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-top"
        src={flow.video.src}
        poster={near ? flow.video.poster : undefined}
        muted
        playsInline
        preload={near ? "metadata" : "none"}
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
      <button
        ref={overlayRef}
        type="button"
        inert={playing}
        onClick={() => {
          onPlayRequest();
          void videoRef.current?.play().catch(() => undefined);
        }}
        // Inset ring: the frame clips anything drawn outside it.
        className={`walk-play absolute inset-0 flex items-center justify-center bg-[#0b0e13]/25 transition-[background-color,opacity] duration-200 hover:bg-[#0b0e13]/35 focus-visible:-outline-offset-4 ${focusRing} ${
          playing ? "pointer-events-none opacity-0" : ""
        }`}
        aria-label={`Play: ${flow.label} walkthrough`}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-ground shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)]">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="ml-1 h-6 w-6 fill-current">
            <path d="M4 2.5v11l9-5.5z" />
          </svg>
        </span>
      </button>
    </div>
  );
}
