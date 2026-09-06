"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ContactDialog } from "@/components/ui/ContactDialog";
import { profile } from "@/lib/content/profile";

/*
  The Rive runtime is roughly the size of everything else this site ships, so it is not
  allowed anywhere near the first paint. Two gates:

    1. next/dynamic with ssr:false — the runtime lands in its own client chunk.
    2. An IntersectionObserver — that chunk is not even requested until the contact
       section is close to the viewport, which for most visitors is never.

  The placeholder reserves the same height the canvas will occupy, so nothing shifts
  when it swaps in.
*/
const ContactCat = dynamic(() => import("@/components/sections/ContactCat"), {
  ssr: false,
  loading: () => <Plate />,
});

function Plate({ children }: { children?: React.ReactNode }) {
  return (
    // Mirrors the canvas sizing in ContactCat (the artboard's own 1500x700 ratio), so
    // the swap-in shifts nothing.
    <div className="tick-frame max-w-[440px] overflow-hidden border border-line bg-[#e6eaf2] p-2">
      <div className="flex aspect-[1500/700] w-full items-center justify-center">{children}</div>
    </div>
  );
}

/*
  The plate is on screen long before the cat is — for most visitors it is the only thing
  they ever see there. Clicking it has to open the same form, or the section spends its
  first seconds looking interactive while doing nothing.
*/
function PlateTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <a
      href={`mailto:${profile.email}`}
      aria-label={`Start a thread with ${profile.name}`}
      aria-haspopup="dialog"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onOpen();
      }}
      className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <Plate />
    </a>
  );
}

export function ContactCatFrame() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [threadOpen, setThreadOpen] = useState(false);

  const openThread = useCallback(() => setThreadOpen(true), []);
  const closeThread = useCallback(() => setThreadOpen(false), []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    /*
      No IntersectionObserver (or an old engine): load it rather than leave an empty
      plate sitting there. Scheduled rather than set inline — a synchronous setState in
      an effect body cascades a second render, and initial state stays false either way
      so the server and the first client render still agree.
    */
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <figure ref={ref} className="m-0">
      {inView ? <ContactCat onAnswer={openThread} /> : <PlateTrigger onOpen={openThread} />}

      {/*
        The CC BY credit used to sit here. It has moved to the site footer — the licence
        still requires it, but a colophon is a more natural home for it than a caption.
      */}
      <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        Pick up the phone
      </figcaption>

      <ContactDialog open={threadOpen} onClose={closeThread} />
    </figure>
  );
}
