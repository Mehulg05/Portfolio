import { type FormEvent, useEffect, useRef, useState } from "react";
import { notConfiguredReason } from "@/components/sections/ContactEmailNote";
import type {
  ContactErrorCode,
  ContactField,
  ContactRequest,
  ContactResponse,
} from "@/lib/contact/types";

export type ContactFormState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent"; replyTo: string }
  | { status: "error"; message: string; field?: ContactField }
  | { status: "unconfigured" };

/*
  One line of copy per server code. A Record rather than a switch so a code added to the
  contract is a type error here until it has words, and so its keys double as the runtime
  allow-list when the response is parsed.
*/
const errorCopy: Record<ContactErrorCode, string> = {
  invalid: "Check the highlighted field and send again.",
  too_fast: "That was quick. Give it a moment and send again.",
  forbidden: "The server refused a request from this page. Reload and try again.",
  rate_limited: "You have sent a few already. Give it an hour, or email me directly.",
  unconfigured: notConfiguredReason,
  server_error: "Your message did not save on my end. Try again in a minute.",
};

const networkError = "Could not reach the server. Check your connection and try again.";

// Long enough for a cold serverless start plus a database connect, short enough that
// "Sending…" never becomes the final state.
const timeoutMs = 15_000;

const fieldNames = { name: true, email: true, message: true } satisfies Record<ContactField, true>;

function isErrorCode(value: unknown): value is ContactErrorCode {
  return typeof value === "string" && Object.hasOwn(errorCopy, value);
}

function isField(value: unknown): value is ContactField {
  return typeof value === "string" && Object.hasOwn(fieldNames, value);
}

// The body is whatever came over the wire: a platform error page, a proxy, a half-deployed
// route. Anything that is not the contract is treated as not having reached the API.
function parseResponse(value: unknown): ContactResponse | null {
  if (typeof value !== "object" || value === null) return null;
  const body = value as Record<string, unknown>;
  if (body.ok === true) return { ok: true };
  if (body.ok !== false || !isErrorCode(body.code)) return null;
  const message = typeof body.message === "string" ? body.message : "";
  return isField(body.field)
    ? { ok: false, code: body.code, message, field: body.field }
    : { ok: false, code: body.code, message };
}

async function post(body: ContactRequest) {
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return parseResponse(await response.json());
  } catch {
    return null;
  }
}

function text(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
}

type FocusTarget = "heading" | "note" | ContactField;

/*
  The form is uncontrolled: the DOM keeps what the visitor typed, so an error leaves it in
  place, and success unmounts the form so "Send another" starts from empty fields.
*/
export function useContactForm() {
  const [state, setState] = useState<ContactFormState>({ status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const openedAt = useRef(0);
  // A ref, not state: Enter in a field can resubmit before the "sending" render lands.
  const inFlight = useRef(false);
  const focusNext = useRef<FocusTarget | null>(null);

  // On mount rather than at render, so the clock starts when the form is live in a browser.
  useEffect(() => {
    openedAt.current = performance.now();
  }, []);

  // Focus moves after the render that created its target, never during the first one.
  useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    if (target === "heading") headingRef.current?.focus();
    else if (target === "note") noteRef.current?.focus();
    else {
      const field = formRef.current?.elements.namedItem(target);
      if (field instanceof HTMLElement) field.focus();
    }
  }, [state]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;

    const data = new FormData(event.currentTarget);
    const body: ContactRequest = {
      name: text(data, "name"),
      email: text(data, "email"),
      message: text(data, "message"),
      website: text(data, "website"),
      elapsedMs: Math.round(performance.now() - openedAt.current),
    };

    inFlight.current = true;
    setState({ status: "sending" });
    const result = await post(body);
    inFlight.current = false;

    if (!result) {
      setState({ status: "error", message: networkError });
    } else if (result.ok) {
      focusNext.current = "heading";
      setState({ status: "sent", replyTo: body.email.trim() });
    } else if (result.code === "unconfigured") {
      focusNext.current = "note";
      setState({ status: "unconfigured" });
    } else if (result.code === "invalid") {
      focusNext.current = result.field ?? null;
      setState({
        status: "error",
        message: result.message || errorCopy.invalid,
        field: result.field,
      });
    } else {
      setState({ status: "error", message: errorCopy[result.code] });
    }
  }

  function reset() {
    openedAt.current = performance.now();
    focusNext.current = "name";
    setState({ status: "idle" });
  }

  // Once the visitor edits the field the server flagged, the flag is stale.
  function clearFieldError(event: FormEvent<HTMLFormElement>) {
    if (state.status !== "error" || !state.field) return;
    const target = event.target;
    if (
      (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) &&
      target.name === state.field
    ) {
      setState({ status: "idle" });
    }
  }

  return { state, submit, reset, clearFieldError, formRef, headingRef, noteRef };
}
