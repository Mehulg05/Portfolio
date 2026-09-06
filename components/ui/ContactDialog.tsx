"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { profile } from "@/lib/content/profile";
import { pauseSmoothScroll, resumeSmoothScroll } from "@/lib/smooth-scroll";

/*
  Web3Forms. The access key is public by design — it ships in the client bundle and rides
  along in every request the browser makes, and all it authorises is "deliver to the inbox
  this key is bound to". It still lives in an env var rather than in source, so it can be
  rotated without a code change and a public repo is not a spam list.
*/
const ENDPOINT = "https://api.web3forms.com/submit";
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

type Status = "idle" | "sending" | "sent" | "error";

const field =
  "w-full border border-line bg-ground px-3 py-2.5 font-sans text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none";
const label = "font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint";

export function ContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  /*
    A native <dialog>, not a hand-rolled overlay: the focus trap, the Esc key, the top
    layer and inerting everything behind it are the platform's job, and it does them
    better than a div would. What follows is only the part it does not do.
  */
  // Idempotent, so every path below can call it without checking who got there first.
  const release = useCallback(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-thread-open")) return;
    root.removeAttribute("data-thread-open");
    resumeSmoothScroll();
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open) {
      if (dialog.open) return;
      setStatus("idle");
      setError(null);
      dialog.showModal();
      // Lenis would otherwise keep scrolling the page underneath the backdrop.
      document.documentElement.setAttribute("data-thread-open", "");
      pauseSmoothScroll();
      return;
    }

    if (dialog.open) dialog.close();
    /*
      Belt and braces. The close event below is the primary release — it is the only
      thing that catches Esc and the backdrop — but hanging the lock off React state as
      well means a swallowed event can never strand the page unscrollable.
    */
    release();
  }, [open, release]);

  /*
    Esc and a backdrop click close the dialog without React being involved, so the
    element's own close event — not the click handler — is the one place the parent's
    state and the scroll lock are put back.
  */
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleClose = () => {
      release();
      onClose();
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose, release]);

  // Unmounting while open would otherwise leave the page locked for good.
  useEffect(() => release, [release]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = event.currentTarget;
    const entries = Object.fromEntries(new FormData(form));

    setStatus("sending");
    setError(null);

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          ...entries,
          from_name: "The Build Log",
          subject: `New thread from ${entries.name || "the portfolio"}`,
        }),
      });

      // A rejection still returns JSON with the reason; surface that, not "try again".
      const result = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
      } | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `The form service returned ${response.status}.`);
      }

      form.reset();
      setStatus("sent");
    } catch (cause) {
      setStatus("error");
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : "That did not go through — the network or the form service is unreachable.",
      );
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="thread-dialog"
      // With no padding on the dialog, the element itself is only ever hit on the backdrop.
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close();
      }}
    >
      <div className="tick-frame border border-line-bright bg-surface">
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
              Line open
            </p>
            <h2 id={titleId} className="mt-1.5 font-display text-xl tracking-tight text-ink">
              Start a thread
            </h2>
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="-mt-1 -mr-1 border border-line px-2.5 py-1 font-mono text-[13px] leading-none text-ink-faint hover:border-accent hover:text-accent"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        {status === "sent" ? (
          <div className="px-5 py-8 text-center sm:px-6">
            <p className="font-display text-lg tracking-tight text-ink">Message sent.</p>
            <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-relaxed text-ink-dim">
              It landed in my inbox. I read everything and reply to anything real — usually
              within a day or two.
            </p>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="mt-6 border border-line-bright px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim hover:border-accent hover:text-accent"
            >
              Close
            </button>
          </div>
        ) : !ACCESS_KEY ? (
          /*
            No key at build time means every submit fails. Say so and hand over the
            address, rather than showing a form that cannot work.
          */
          <div className="px-5 py-8 sm:px-6">
            <p className="text-sm leading-relaxed text-ink-dim">
              The form is not configured on this build. Reach me at{" "}
              <a href={`mailto:${profile.email}`} className="text-accent hover:underline">
                {profile.email}
              </a>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-5 sm:px-6 sm:py-6">
            {/* Honeypot. Bots fill it in, people never see it. */}
            <input
              type="checkbox"
              name="botcheck"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="thread-name" className={label}>
                  Name
                </label>
                <input
                  id="thread-name"
                  name="name"
                  type="text"
                  required
                  maxLength={100}
                  autoComplete="name"
                  autoFocus
                  placeholder="Who is writing"
                  className={field}
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="thread-email" className={label}>
                  Email
                </label>
                <input
                  id="thread-email"
                  name="email"
                  type="email"
                  required
                  maxLength={150}
                  autoComplete="email"
                  placeholder="Where I should reply"
                  className={field}
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="thread-message" className={label}>
                  Message
                </label>
                <textarea
                  id="thread-message"
                  name="message"
                  required
                  rows={5}
                  maxLength={2000}
                  placeholder="What's the role, and what would I be working on?"
                  className={`${field} resize-y`}
                />
              </div>
            </div>

            {status === "error" ? (
              <p
                role="alert"
                className="mt-4 border-l-2 border-redline pl-3 text-sm leading-relaxed text-ink-dim"
              >
                {error}{" "}
                <a href={`mailto:${profile.email}`} className="text-accent hover:underline">
                  Email me directly
                </a>{" "}
                instead.
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                Goes straight to my inbox
              </p>
              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex items-center gap-2 border border-accent bg-accent px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ground hover:border-ink hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-accent disabled:hover:bg-accent"
              >
                {status === "sending" ? "Sending…" : "Send"}
              </button>
            </div>

            {/* Announced without stealing focus mid-submit. */}
            <p aria-live="polite" className="sr-only">
              {status === "sending" ? "Sending your message" : ""}
            </p>
          </form>
        )}
      </div>
    </dialog>
  );
}
