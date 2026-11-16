import { createHmac, timingSafeEqual } from "node:crypto";

/*
  The admin session cookie, as pure functions of (secret, time) so they are unit-tested.

  Value: `v2.<issuedAtMs>.<expiresAtMs>.<hmacHex>`. The HMAC key is derived from INBOX_SECRET
  with a fixed label, so the secret itself is never the signing key and the code hashes
  (which use the raw secret) cannot be confused with session signatures. `issuedAt` lets the
  server revoke every session issued before a point in time (see admin_session_state).
*/

export const SESSION_LIFETIME_MS = 60 * 60 * 24 * 7 * 1000;

// Digits only, short enough that Number() stays an exact integer.
const SESSION_PATTERN = /^v2\.(\d{1,15})\.(\d{1,15})\.([0-9a-f]{64})$/;

export type SessionClaims = { issuedAt: number; expiresAt: number };

function sessionKey(secret: string) {
  return createHmac("sha256", secret).update("admin-session-v1", "utf8").digest();
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", sessionKey(secret)).update(payload, "utf8").digest();
}

export function createSessionValue(secret: string, now: number) {
  const payload = `${now}.${now + SESSION_LIFETIME_MS}`;
  return `v2.${payload}.${sign(payload, secret).toString("hex")}`;
}

/** The claims a cookie value proves, or null when it is forged, malformed or expired. */
export function verifySessionValue(secret: string, value: string, now: number): SessionClaims | null {
  const match = SESSION_PATTERN.exec(value);
  if (!match) return null;
  const [, issued = "", expires = "", signature = ""] = match;

  // Signature first, so a forged value and an expired one cost the same and nothing
  // about the expiry is trusted until it is authenticated.
  const expected = sign(`${issued}.${expires}`, secret);
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) return null;

  const claims = { issuedAt: Number(issued), expiresAt: Number(expires) };
  return claims.expiresAt > now ? claims : null;
}

/** False when the session was issued before the revocation point. A null point revokes nothing. */
export function isIssuedAfter(claims: SessionClaims, validAfterMs: number | null) {
  return validAfterMs === null || claims.issuedAt >= validAfterMs;
}
