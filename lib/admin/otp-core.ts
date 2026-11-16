import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/*
  The pure half of emailed sign-in codes: generation, hashing, verification, the
  throttle arithmetic and the email body. No database, no env, no framework imports, so
  Node's native type stripping can unit-test it directly. lib/admin/otp.ts does the I/O.
*/

export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 10 * 60;
/** Codes that may be requested per window, across all callers: the inbox is the thing protected. */
export const OTP_REQUEST_LIMIT = 3;
export const OTP_REQUEST_WINDOW_SECONDS = 10 * 60;
/** Wrong guesses a single code survives, however many IPs they come from. */
export const OTP_MAX_ATTEMPTS = 5;

/** Failed sign-ins (password or code) per IP hash per window before it is locked out. */
export const LOGIN_FAILURE_LIMIT = 15;
export const LOGIN_WINDOW_SECONDS = 60;

const CODE_PATTERN = new RegExp(`^\\d{${OTP_LENGTH}}$`);

export type StoredCode = { codeHash: string; expiresAt: Date; attempts: number; usedAt: Date | null };

export function isLockedOut(recentFailures: number) {
  return recentFailures >= LOGIN_FAILURE_LIMIT;
}

/** Uniform over 000000-999999 from the CSPRNG; randomInt avoids modulo bias. */
export function generateCode() {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

/** HMAC-SHA256 hex. The prefix keeps this keyed use apart from the session signature. */
export function hashCode(code: string, key: string) {
  return createHmac("sha256", key).update(`admin-otp:${code}`, "utf8").digest("hex");
}

/** A code that can still be redeemed: unused, unexpired and not guessed at too often. */
export function isRedeemable(stored: StoredCode, now: Date) {
  return stored.usedAt === null && stored.expiresAt.getTime() > now.getTime() && stored.attempts < OTP_MAX_ATTEMPTS;
}

/**
 * Constant-time check of a typed code against the stored hash. Malformed input is
 * rejected before hashing; both digests are fixed length, so timingSafeEqual is safe.
 */
export function codeMatches(candidate: string, storedHash: string, key: string) {
  if (!CODE_PATTERN.test(candidate)) return false;
  const expected = Buffer.from(storedHash, "hex");
  const provided = Buffer.from(hashCode(candidate, key), "hex");
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function buildCodeEmail(code: string, to: string, host: string) {
  return {
    from: "Portfolio admin <onboarding@resend.dev>",
    to: [to],
    subject: `Your sign-in code: ${code}`,
    text: [
      `Your sign-in code for ${host} is ${code}.`,
      "",
      `It works once and expires in ${OTP_TTL_SECONDS / 60} minutes. If you did not ask for it, ignore this email; nobody can sign in without it.`,
    ].join("\n"),
  };
}
