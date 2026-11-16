import { createHash, timingSafeEqual } from "node:crypto";

/** SHA-256 digest of a string, as bytes. */
export function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Constant-time string comparison. Both sides are hashed first because timingSafeEqual
 * needs equal lengths, and comparing raw lengths would leak the secret's.
 */
export function constantTimeEquals(a: string, b: string) {
  return timingSafeEqual(sha256(a), sha256(b));
}
