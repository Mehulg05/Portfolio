import "server-only";
import { createHmac } from "node:crypto";
import { siteUrl } from "@/lib/site";

/*
  Request-level abuse checks for POST /api/contact: who is asking (a hashed IP) and from
  where (the Origin). Neither stops a determined attacker; together with the rate limit
  they make the form a poor target for drive-by spam.
*/

// Only used outside production, so local runs work without setting a secret. Hashes made
// with it are not private, which is fine for rows in a throwaway dev database.
const developmentSalt = "portfolio-contact-dev-salt";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function ipSalt() {
  const salt = process.env.IP_HASH_SALT;
  if (salt) return salt;
  return isProduction() ? null : developmentSalt;
}

/** False in production without IP_HASH_SALT: a guessable salt would make the hashes reversible. */
export function isIpHashConfigured() {
  return ipSalt() !== null;
}

/**
 * HMAC-SHA256 of the IP, hex. Keyed rather than a plain hash because the IPv4 space is
 * small enough to brute-force an unsalted digest. Throws when unconfigured; the route
 * checks `isIpHashConfigured()` first.
 */
export function hashIp(ip: string) {
  const salt = ipSalt();
  if (salt === null) throw new Error("IP_HASH_SALT is not set.");
  return createHmac("sha256", salt).update(ip).digest("hex");
}

/*
  Vercel overwrites x-forwarded-for with the real client address, so its first entry is
  trustworthy there. Elsewhere it is client-controlled, which at worst lets someone spread
  their submissions across fake IPs; the per-email window still applies.
*/
export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  return networkOf(forwarded || real || "unknown");
}

/*
  Every limiter keys on this, so an IPv6 address is cut to its /64: a single client usually
  controls the whole /64 and could otherwise take a fresh bucket per address.
*/
function networkOf(ip: string) {
  if (!ip.includes(":") || ip.includes(".")) return ip;
  const [head = "", tail = ""] = ip.toLowerCase().split("::");
  const front = head ? head.split(":") : [];
  const back = tail ? tail.split(":") : [];
  const groups = ip.includes("::") ? [...front, ...Array(Math.max(0, 8 - front.length - back.length)).fill("0"), ...back] : front;
  return `${groups.slice(0, 4).map((group) => group.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}

function allowedOrigins() {
  const origins = new Set([new URL(siteUrl).origin]);
  // Preview deployments live on generated hosts; without these the form fails on every PR.
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (host) origins.add(`https://${host}`);
  }
  return origins;
}

function originOf(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function requestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const referer = request.headers.get("referer");
  return referer ? originOf(referer) : null;
}

/**
 * Browsers always send Origin on a cross-site POST, so a mismatch means another site is
 * posting into the form. Skipped outside production, where localhost ports and tunnels vary.
 */
export function isTrustedContactOrigin(request: Request) {
  if (!isProduction()) return true;
  const origin = requestOrigin(request);
  return origin !== null && allowedOrigins().has(origin);
}
