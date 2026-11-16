/*
  Validation for POST /api/pulse beacons, by hand like lib/contact/validate.ts.

  Unit-tested with Node's native type stripping, so this file stays pure and imports nothing.
  Every rule is strict: our own client never sends a malformed beacon, so anything that
  fails is a script or a stale client and the route drops it without saying why.

  One exception is clamped rather than rejected: `seconds` above a day becomes 86400. The
  client counts visible time only, but a tab left in front of a screensaver can still exceed
  a day, and losing that view's scroll and section data over it would be worse than capping.
*/

export type PulseScreen = "phone" | "desktop";

export type PulseView = {
  kind: "view";
  viewId: string;
  path: string;
  referrerHost: string | null;
  screen: PulseScreen;
};

export type PulseLeave = {
  kind: "leave";
  viewId: string;
  seconds: number;
  maxScrollPct: number;
  sections: string[];
  resumeClicked: boolean;
  mailtoClicked: boolean;
};

export type PulseEvent = PulseView | PulseLeave;

export type PulseValidation = { ok: true; value: PulseEvent } | { ok: false };

export const pulseLimits = {
  pathMax: 100,
  hostMax: 253,
  secondsMax: 86_400,
  sectionsMax: 30,
  sectionIdMax: 60,
} as const;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// Also catches Unicode line separators, which would split a path across lines in any log or CSV.
const controlCharacters = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
// Dot-separated DNS labels, 1-63 chars each, no leading or trailing hyphen. URL.hostname
// already lowercases and punycodes, so ASCII is all a real referrer can contain.
const hostnamePattern = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;
const sectionIdPattern = /^[a-z0-9][a-z0-9_-]*$/;

const rejected: PulseValidation = { ok: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIntegerIn(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

function readViewId(value: unknown) {
  if (typeof value !== "string" || value.length !== 36) return null;
  const id = value.toLowerCase();
  return uuidPattern.test(id) ? id : null;
}

/** The path without query or hash, or null when it is not a plain site path. */
function readPath(value: unknown) {
  if (typeof value !== "string") return null;
  const path = value.split(/[?#]/, 1)[0] ?? "";
  if (!path.startsWith("/") || path.length > pulseLimits.pathMax) return null;
  return controlCharacters.test(path) ? null : path;
}

/** `undefined` means invalid; null is a valid "no referrer". */
export function readReferrerHost(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > pulseLimits.hostMax) return undefined;
  const host = value.toLowerCase();
  return hostnamePattern.test(host) ? host : undefined;
}

function readScreen(value: unknown): PulseScreen | null {
  return value === "phone" || value === "desktop" ? value : null;
}

function readSeconds(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) return null;
  return Math.min(value, pulseLimits.secondsMax);
}

/** Deduped section ids in first-seen order, or null when any entry is not slug-shaped. */
export function readSections(value: unknown) {
  if (!Array.isArray(value)) return null;
  const ids = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string" || item.length > pulseLimits.sectionIdMax) return null;
    if (!sectionIdPattern.test(item)) return null;
    ids.add(item);
  }
  return ids.size <= pulseLimits.sectionsMax ? [...ids] : null;
}

function validateView(input: Record<string, unknown>, viewId: string): PulseValidation {
  const path = readPath(input.path);
  const referrerHost = readReferrerHost(input.referrerHost);
  const screen = readScreen(input.screen);
  if (path === null || referrerHost === undefined || screen === null) return rejected;
  return { ok: true, value: { kind: "view", viewId, path, referrerHost, screen } };
}

function validateLeave(input: Record<string, unknown>, viewId: string): PulseValidation {
  const seconds = readSeconds(input.seconds);
  const sections = readSections(input.sections);
  const { maxScrollPct, resumeClicked, mailtoClicked } = input;
  if (seconds === null || sections === null) return rejected;
  if (!isIntegerIn(maxScrollPct, 0, 100)) return rejected;
  if (typeof resumeClicked !== "boolean" || typeof mailtoClicked !== "boolean") return rejected;
  return {
    ok: true,
    value: { kind: "leave", viewId, seconds, maxScrollPct, sections, resumeClicked, mailtoClicked },
  };
}

/** Turns an untrusted JSON body into a beacon, or rejects it without a reason. */
export function validatePulse(body: unknown): PulseValidation {
  if (!isRecord(body)) return rejected;
  const viewId = readViewId(body.viewId);
  if (viewId === null) return rejected;
  if (body.kind === "view") return validateView(body, viewId);
  if (body.kind === "leave") return validateLeave(body, viewId);
  return rejected;
}
