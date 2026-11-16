/*
  The wire contract between the contact form and POST /api/contact. Shared by both ends
  so a new error code is a type error in the UI until it has copy.
*/

export const contactLimits = {
  name: { min: 1, max: 100 },
  email: { max: 150 },
  message: { min: 10, max: 2000 },
  /** A person cannot read the form and type a message faster than this. */
  minFillMs: 3000,
} as const;

export type ContactField = "name" | "email" | "message";

export type ContactErrorCode =
  | "invalid" // a field failed validation; `field` says which
  | "too_fast" // submitted before minFillMs
  | "forbidden" // cross-origin request
  | "rate_limited" // per-IP or per-email window is full
  | "unconfigured" // DATABASE_URL (or IP_HASH_SALT in production) missing on this deployment
  | "server_error"; // the insert failed

export type ContactResponse =
  | { ok: true }
  | { ok: false; code: ContactErrorCode; message: string; field?: ContactField };

/**
 * What the browser sends. `website` is the honeypot; people never see it. `elapsedMs` is
 * how long the form was open, measured on the client's monotonic clock: a duration rather
 * than a timestamp, so a device clock that runs fast cannot lock a person out.
 */
export type ContactRequest = {
  name: string;
  email: string;
  message: string;
  website: string;
  elapsedMs: number;
};
