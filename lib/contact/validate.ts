import type { ContactField, ContactRequest } from "./types";

/*
  Validation for POST /api/contact, written by hand because three string fields do not
  justify a schema library in the bundle.

  This file is unit-tested with Node's native type stripping, which cannot resolve
  extensionless or `@/` imports. The only import is `import type`, which is erased, so the
  limits arrive as a parameter: the route passes `contactLimits`, tests pass the same object.
*/

export type ValidationLimits = {
  name: { min: number; max: number };
  email: { max: number };
  message: { min: number; max: number };
};

/**
 * A request that passed validation. `elapsedMs` is null when the client did not send a
 * usable duration; the route treats that as "too fast" rather than as a field error,
 * because no person can fix it from the form.
 */
export type ContactSubmission = Omit<ContactRequest, "elapsedMs"> & { elapsedMs: number | null };

export type ValidationError = { field: ContactField; message: string };

export type ValidationResult =
  | { ok: true; value: ContactSubmission }
  | ({ ok: false } & ValidationError);

// Pragmatic, not RFC 5322: one @, no whitespace, at least one dot in the domain. The real
// check is whether a reply arrives.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A name is one line: a newline in it would forge extra header-like lines in the email body.
const controlCharacters = /[\u0000-\u001f\u007f\u2028\u2029]/;
// Postgres text cannot hold NUL; letting it through turns a bad request into a 500.
const nulCharacter = /\u0000/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// A non-string is treated as an empty field: the message a person sees is the same.
function trimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function fail(field: ContactField, message: string): ValidationResult {
  return { ok: false, field, message };
}

function validateName(value: string, limits: ValidationLimits) {
  if (value.length < limits.name.min) return "Please enter your name.";
  if (value.length > limits.name.max) return `Your name must be ${limits.name.max} characters or fewer.`;
  if (controlCharacters.test(value)) return "Please keep your name on one line.";
  return null;
}

function validateEmail(value: string, limits: ValidationLimits) {
  if (value.length === 0) return "Please enter your email address.";
  // Length before pattern, so the regex never runs on an oversized string.
  if (value.length > limits.email.max) return `Your email address must be ${limits.email.max} characters or fewer.`;
  if (!emailPattern.test(value) || controlCharacters.test(value)) return "Please enter a valid email address.";
  return null;
}

function validateMessage(value: string, limits: ValidationLimits) {
  if (value.length === 0) return "Please write a message.";
  if (value.length < limits.message.min) return `Your message must be at least ${limits.message.min} characters.`;
  if (value.length > limits.message.max) return `Your message must be ${limits.message.max} characters or fewer.`;
  if (nulCharacter.test(value)) return "Your message contains a character that cannot be saved.";
  return null;
}

/*
  The honeypot is never a validation error: a bot must get the same success a person does.
  Anything other than a missing value or an empty string counts as filled, so a bot that
  sends `website: 1` is still caught.
*/
function readHoneypot(value: unknown) {
  if (value === undefined || value === null) return "";
  return typeof value === "string" ? value.trim() : String(value);
}

function readElapsed(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Checked before field validation, so a bot that fills the trap gets the same success
 * whatever else it sent, and never a field error that would teach it what to fix.
 */
export function isHoneypotFilled(body: unknown) {
  return isRecord(body) && readHoneypot(body.website) !== "";
}

/** Turns an untrusted JSON body into a trimmed submission or the first field that failed. */
export function validateContact(body: unknown, limits: ValidationLimits): ValidationResult {
  // A non-object body has no fields, so it fails on the first one like an empty form would.
  const input = isRecord(body) ? body : {};

  const name = trimmed(input.name);
  const email = trimmed(input.email);
  const message = trimmed(input.message);

  const nameError = validateName(name, limits);
  if (nameError) return fail("name", nameError);
  const emailError = validateEmail(email, limits);
  if (emailError) return fail("email", emailError);
  const messageError = validateMessage(message, limits);
  if (messageError) return fail("message", messageError);

  return {
    ok: true,
    value: {
      name,
      email,
      message,
      website: readHoneypot(input.website),
      elapsedMs: readElapsed(input.elapsedMs),
    },
  };
}
