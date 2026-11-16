"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/*
  Self-hosted page analytics: one beacon when a page opens, one when it is left. No
  cookies, no storage, no fingerprinting; the server derives a visitor hash that rotates
  daily. Anyone asking not to be tracked (Do Not Track, Global Privacy Control) sends
  nothing at all, and neither does the admin host.
*/

const endpoint = "/api/pulse";

type Engagement = {
  seconds: number;
  maxScrollPct: number;
  sections: string[];
  resumeClicked: boolean;
  mailtoClicked: boolean;
};

function optedOut() {
  const gpc = "globalPrivacyControl" in navigator && navigator.globalPrivacyControl === true;
  return navigator.doNotTrack === "1" || gpc || location.hostname.startsWith("admin.");
}

function send(body: object) {
  const json = JSON.stringify(body);
  try {
    if (navigator.sendBeacon?.(endpoint, new Blob([json], { type: "application/json" }))) return;
  } catch {
    // Some browsers refuse a typed Blob; fetch below covers them.
  }
  void fetch(endpoint, {
    method: "POST",
    body: json,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    credentials: "omit",
  }).catch(() => {});
}

function referrerHost() {
  try {
    const host = new URL(document.referrer).hostname;
    return host && host !== location.hostname ? host : null;
  } catch {
    return null;
  }
}

function scrollPct() {
  const height = document.documentElement.scrollHeight;
  if (height <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round(((scrollY + innerHeight) / height) * 100)));
}

function linkKind(target: EventTarget | null) {
  const href = target instanceof Element ? target.closest("a")?.getAttribute("href")?.toLowerCase() : undefined;
  if (!href) return null;
  if (href.startsWith("mailto:")) return "mailto";
  const path = href.split(/[?#]/, 1)[0] ?? "";
  return path.endsWith(".pdf") || href.includes("resume") ? "resume" : null;
}

/** Starts one view: sends it, tracks engagement, and returns the cleanup that sends the leave. */
function trackView() {
  const viewId = crypto.randomUUID();
  send({
    kind: "view",
    viewId,
    path: location.pathname,
    referrerHost: referrerHost(),
    screen: matchMedia("(max-width: 767px)").matches ? "phone" : "desktop",
  });

  const unseen = new Set(document.querySelectorAll<HTMLElement>("section[id]"));
  const seen = new Set<string>();
  const state: Omit<Engagement, "seconds" | "sections"> = { maxScrollPct: 0, resumeClicked: false, mailtoClicked: false };
  // Visible time only: the clock pauses while the tab is hidden.
  let visibleMs = 0;
  let visibleSince: number | null = document.visibilityState === "visible" ? performance.now() : null;
  let frame = 0;
  let lastSent = "";

  const measure = () => {
    frame = 0;
    state.maxScrollPct = Math.max(state.maxScrollPct, scrollPct());
    const middle = innerHeight / 2;
    for (const section of unseen) {
      if (section.getBoundingClientRect().top > middle) continue;
      seen.add(section.id);
      unseen.delete(section);
    }
  };

  const onScroll = () => {
    frame ||= requestAnimationFrame(measure);
  };

  const onClick = (event: MouseEvent) => {
    const kind = linkKind(event.target);
    if (kind === "resume") state.resumeClicked = true;
    if (kind === "mailto") state.mailtoClicked = true;
  };

  /*
    Sent on every hide, not just the first: mobile browsers often kill a hidden tab
    without a pagehide, so each hide is possibly the last chance. The server overwrites
    the row with these cumulative values, and an unchanged payload is not resent, which
    covers the usual hidden-then-pagehide pair.
  */
  const leave = () => {
    if (visibleSince !== null) {
      visibleMs += performance.now() - visibleSince;
      visibleSince = null;
    }
    const engagement: Engagement = { ...state, seconds: Math.round(visibleMs / 1000), sections: [...seen] };
    const json = JSON.stringify(engagement);
    if (json === lastSent) return;
    lastSent = json;
    send({ kind: "leave", viewId, ...engagement });
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") leave();
    else visibleSince ??= performance.now();
  };

  measure();
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("pagehide", leave);
  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("click", onClick, { capture: true });

  return () => {
    cancelAnimationFrame(frame);
    removeEventListener("scroll", onScroll);
    removeEventListener("pagehide", leave);
    document.removeEventListener("visibilitychange", onVisibility);
    document.removeEventListener("click", onClick, { capture: true });
    leave();
  };
}

export function Pulse() {
  // A client-side navigation is a new page view: the old one is left, a new one starts.
  const pathname = usePathname();

  useEffect(() => {
    if (optedOut() || typeof crypto.randomUUID !== "function") return;
    let stop: (() => void) | null = null;
    // Deferred a tick so StrictMode's mount-unmount-mount in development records one view, not two.
    const start = setTimeout(() => {
      stop = trackView();
    }, 0);
    return () => {
      clearTimeout(start);
      stop?.();
    };
  }, [pathname]);

  return null;
}
