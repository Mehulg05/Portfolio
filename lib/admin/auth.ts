import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/*
  Auth for the private admin panel. There is one reader, so there are no accounts: the
  owner proves they know INBOX_SECRET once and gets a signed, expiring cookie.

  The session value is `${expiresAtMs}.${hmacHex}` with HMAC-SHA256 keyed by INBOX_SECRET.
  Nothing is stored server-side, so rotating INBOX_SECRET invalidates every session at
  once: old signatures stop verifying under the new key. That is the sign-out-everywhere
  button.
*/

export const INBOX_COOKIE = "inbox_session";
export const INBOX_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const SESSION_LIFETIME_MS = INBOX_SESSION_MAX_AGE_SECONDS * 1000;
// Digits only, and short enough that Number() stays an exact integer.
const SESSION_PATTERN = /^(\d{1,15})\.([0-9a-f]{64})$/;

/*
  The brute-force argument (no lockout, just a short delay) only holds for a long random
  secret, so a short one is treated as no secret at all rather than trusted.
*/
export const MIN_SECRET_LENGTH = 32;

function readSecret() {
  const secret = process.env.INBOX_SECRET;
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

export function verifySessionValue(value: string, now: number) {
  const secret = readSecret();
  if (!secret) return false;

  const match = SESSION_PATTERN.exec(value);
  if (!match) return false;
  const [, expiresAt, signature] = match;

  // The signature is checked before the expiry so a forged value and an expired one
  // cost the same, and nothing about the expiry is trusted until it is authenticated.
  const expected = sign(expiresAt, secret);
  const provided = Buffer.from(signature, "hex");
  if (!timingSafeEqual(expected, provided)) return false;

  return Number(expiresAt) > now;
}

export async function hasAdminSession() {
  const value = (await cookies()).get(INBOX_COOKIE)?.value;
  return value ? verifySessionValue(value, Date.now()) : false;
}

/**
 * Cheap CSRF belt on top of SameSite=Lax: when the browser says where a POST came from,
 * it has to be this origin. A missing header is allowed (some clients omit it on
 * same-origin form posts); the literal "null" origin is not.
 */
export function isSameOriginOrUnspecified(request: Request) {
  const origin = request.headers.get("origin");
  if (origin === null) return true;
  return origin === new URL(request.url).origin;
}
