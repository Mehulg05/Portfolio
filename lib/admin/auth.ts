import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { adminOrigin } from "@/lib/admin/host";

/*
  Auth for the private admin panel. There is one reader, so there are no accounts: the
  owner proves they know INBOX_SECRET once and gets a signed, expiring cookie.

  The session value is `${expiresAtMs}.${hmacHex}` with HMAC-SHA256 keyed by INBOX_SECRET.
  Nothing is stored server-side, so rotating INBOX_SECRET invalidates every session at
  once: old signatures stop verifying under the new key. That is the sign-out-everywhere
  button.

  The cookie is host-only (no Domain attribute), so it exists on the admin host and the
  public site never carries it.
*/

export const ADMIN_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const SESSION_LIFETIME_MS = ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
// Digits only, and short enough that Number() stays an exact integer.
const SESSION_PATTERN = /^(\d{1,15})\.([0-9a-f]{64})$/;

/*
  Throttling caps guesses at a handful per window, but the real defence is a long random
  secret, so a short one is treated as no secret at all rather than trusted.
*/
export const MIN_SECRET_LENGTH = 32;

export type AdminSession = { expiresAt: Date };

function readSecret() {
  // Trimmed: a trailing newline from a pasted env value would otherwise make sign-in impossible.
  const secret = process.env.INBOX_SECRET?.trim();
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null;
}

export function isAdminConfigured() {
  return readSecret() !== null;
}

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

function sign(data: string, secret: string) {
  return createHmac("sha256", secret).update(data, "utf8").digest();
}

/**
 * Constant-time comparison against INBOX_SECRET. Both sides are hashed first because
 * timingSafeEqual needs equal lengths, and comparing raw lengths would leak the secret's.
 */
export function checkSecret(candidate: string) {
  const secret = readSecret();
  if (!secret) return false;
  return timingSafeEqual(sha256(candidate), sha256(secret));
}

export function createSessionValue(now: number) {
  const secret = readSecret();
  if (!secret) throw new Error("INBOX_SECRET is not set.");

  const expiresAt = String(now + SESSION_LIFETIME_MS);
  return `${expiresAt}.${sign(expiresAt, secret).toString("hex")}`;
}

/** The session a cookie value proves, or null when it is forged, malformed or expired. */
export function verifySessionValue(value: string, now: number): AdminSession | null {
  const secret = readSecret();
  if (!secret) return null;

  const match = SESSION_PATTERN.exec(value);
  if (!match) return null;
  const [, expiresAt, signature] = match;

  // The signature is checked before the expiry so a forged value and an expired one
  // cost the same, and nothing about the expiry is trusted until it is authenticated.
  const expected = sign(expiresAt, secret);
  const provided = Buffer.from(signature, "hex");
  if (!timingSafeEqual(expected, provided)) return null;

  const expiresAtMs = Number(expiresAt);
  return expiresAtMs > now ? { expiresAt: new Date(expiresAtMs) } : null;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return value ? verifySessionValue(value, Date.now()) : null;
}

export async function hasAdminSession() {
  return (await getAdminSession()) !== null;
}

/**
 * Cheap CSRF belt on top of SameSite=Lax: when the browser says where a POST came from,
 * it has to be this origin. The admin origin is accepted alongside the request's own
 * because behind a proxy or rewrite `request.url` can carry an internal origin while the
 * browser reports the public one. A missing header is allowed (some clients omit it on
 * same-origin form posts); the literal "null" origin is not.
 */
export function isSameOriginOrUnspecified(request: Request) {
  const origin = request.headers.get("origin");
  if (origin === null) return true;
  return origin === new URL(request.url).origin || origin === adminOrigin();
}
