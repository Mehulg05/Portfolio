"use client";

import { type ReactNode, type Ref, useId, useState } from "react";
import { ContactEmailNote, notConfiguredReason } from "@/components/sections/ContactEmailNote";
import { type ContactFormState, useContactForm } from "@/components/sections/use-contact-form";
import { type ContactField, contactLimits } from "@/lib/contact/types";

// 16px on phones: iOS Safari zooms the page into any focused field set smaller than that.
const inputClass =
  "w-full min-h-11 border border-line bg-ground px-3 py-2.5 text-base text-ink transition-colors placeholder:text-ink-faint focus:border-accent focus:outline-none aria-[invalid=true]:border-redline aria-[invalid=true]:focus:border-redline sm:min-h-10 sm:text-sm";
const labelClass = "font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint";

/*
  Only for states that do not move focus. Success, the unconfigured note and a field error
  all take focus, and the focused element already reads itself out; announcing them here
  too would say everything twice.
*/
function announcementFor(state: ContactFormState) {
  if (state.status === "sending") return "Sending your message.";
  if (state.status === "error" && !state.field) return `Message not sent. ${state.message}`;
  return "";
}

export function ContactForm({ email }: { email: string }) {
  const { state, submit, reset, clearFieldError, formRef, headingRef, noteRef } =
    useContactForm();
  const id = useId();
  const errorId = `${id}-error`;
  const invalidField = state.status === "error" ? state.field : undefined;

  // Only the field the server named points at the error; the others stay quiet.
  const fieldProps = (field: ContactField) => ({
    id: `${id}-${field}`,
    name: field,
    required: true,
    "aria-invalid": invalidField === field ? true : undefined,
    "aria-describedby": invalidField === field ? errorId : undefined,
  });

  const announcement = announcementFor(state);

  return (
    <div className="contact-form">
      {state.status === "sent" ? (
        <Confirmation replyTo={state.replyTo} headingRef={headingRef} onReset={reset} />
      ) : state.status === "unconfigured" ? (
        <ContactEmailNote email={email} reason={notConfiguredReason} ref={noteRef} />
      ) : (
        // method="post" only matters if someone submits before hydration: the default GET
        // would put their name, email and message in the URL and the browser history.
        <form ref={formRef} method="post" onSubmit={submit} onInput={clearFieldError}>
          {/*
            Honeypot. Off-screen rather than display:none, since naive bots skip hidden
            inputs but fill anything that is laid out. People never reach it.
          */}
          <div className="contact-trap" aria-hidden="true">
            <label htmlFor={`${id}-website`}>Leave this empty</label>
            <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor={`${id}-name`}>
              <input
                {...fieldProps("name")}
                type="text"
                autoComplete="name"
                maxLength={contactLimits.name.max}
                placeholder="Who is writing"
                className={inputClass}
              />
            </Field>
            <Field label="Email" htmlFor={`${id}-email`}>
              <input
                {...fieldProps("email")}
                type="email"
                autoComplete="email"
                maxLength={contactLimits.email.max}
                placeholder="Where I should reply"
                className={inputClass}
              />
            </Field>
          </div>

          <MessageField fieldProps={fieldProps("message")} />

          {state.status === "error" ? (
            <div
              id={errorId}
              className="contact-enter mt-5 border-l-2 border-redline pl-3 text-sm leading-relaxed text-ink-dim"
            >
              <p>{state.message}</p>
              <p className="mt-1">
                Or email{" "}
                <a href={`mailto:${email}`} className="break-all text-accent hover:underline">
                  {email}
                </a>
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <p className="font-mono text-[11px] text-ink-faint">
              Stored in my own Postgres. No third-party form service.
            </p>
            {/*
              aria-disabled, not disabled: a disabled button drops keyboard focus to the
              body mid-submit, and the hook already refuses a second send.
            */}
            <button
              type="submit"
              aria-disabled={state.status === "sending" ? true : undefined}
              className="inline-flex min-h-11 items-center border border-accent bg-accent px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ground hover:border-ink hover:bg-ink aria-disabled:cursor-progress aria-disabled:opacity-60 aria-disabled:hover:border-accent aria-disabled:hover:bg-accent sm:min-h-10"
            >
              {state.status === "sending" ? "Sending…" : "Send message"}
            </button>
          </div>
        </form>
      )}

      {/* Outside the swapped content, so it exists before anything it has to announce. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  aside,
  children,
}: {
  label: string;
  htmlFor: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className={labelClass}>
          {label}
        </label>
        {aside}
      </div>
      {children}
    </div>
  );
}

type FieldProps = {
  id: string;
  name: ContactField;
  required: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

// Owns the character count, so a keystroke re-renders this field and nothing else.
function MessageField({ fieldProps }: { fieldProps: FieldProps }) {
  const [length, setLength] = useState(0);
  const { max, min } = contactLimits.message;
  const countId = `${fieldProps.id}-count`;
  const describedBy = [fieldProps["aria-describedby"], countId].filter(Boolean).join(" ");

  return (
    <div className="mt-4">
      <Field
        label="Message"
        htmlFor={fieldProps.id}
        aside={
          <span
            id={countId}
            className={`font-mono text-[10px] tabular-nums ${length >= max ? "text-redline" : "text-ink-faint"}`}
          >
            {length} / {max}
            <span className="sr-only"> characters</span>
          </span>
        }
      >
        <textarea
          {...fieldProps}
          aria-describedby={describedBy}
          rows={6}
          minLength={min}
          maxLength={max}
          placeholder="What you are building, or what you want to ask"
          onChange={(event) => setLength(event.currentTarget.value.length)}
          className={`${inputClass} block resize-y`}
        />
      </Field>
    </div>
  );
}

function Confirmation({
  replyTo,
  headingRef,
  onReset,
}: {
  replyTo: string;
  headingRef: Ref<HTMLHeadingElement>;
  onReset: () => void;
}) {
  return (
    <div className="contact-enter">
      <h4
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-xl tracking-tight text-ink focus:outline-none"
      >
        Message received.
      </h4>
      <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-ink-dim">
        It is in my inbox. I reply to anything real, usually within two days.
      </p>
      {replyTo ? (
        <p className="mt-3 font-mono text-[11px] break-all text-ink-faint">
          Reply goes to {replyTo}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex min-h-11 items-center border border-line-bright px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim hover:border-accent hover:text-accent sm:min-h-10"
      >
        Send another
      </button>
    </div>
  );
}
