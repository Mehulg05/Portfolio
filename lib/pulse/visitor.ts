import "server-only";
import { createHmac } from "node:crypto";
import { clientIp } from "@/lib/contact/abuse";

/*
  Who a beacon came from, without knowing who that is. The key includes today's UTC date,
  so the same person gets a new hash every day: "unique visitors" are unique per day and a
  visitor cannot be followed from one day to the next. Nothing is stored that could be
  turned back into an IP, and no cookie or client id is involved.
*/

// Same approach as lib/contact/abuse.ts: a fixed salt is fine for a throwaway dev database
// and refused in production, where it would make the hashes brute-forceable.
const developmentSalt = "portfolio-pulse-dev-salt";
const maxUserAgentLength = 300;

function salt() {
  const configured = process.env.IP_HASH_SALT;
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : developmentSalt;
}

/** Today's date in UTC as YYYY-MM-DD, the same day the database stores in page_views.day. */
export function utcDay(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** HMAC-SHA256 over ip|user-agent keyed with salt:day, hex. Null when no salt is configured. */
export function visitorHash(request: Request, now = new Date()) {
  const key = salt();
  if (key === null) return null;
  const userAgent = request.headers.get("user-agent")?.slice(0, maxUserAgentLength) ?? "";
  return createHmac("sha256", `${key}:${utcDay(now)}`)
    .update(`${clientIp(request)}|${userAgent}`)
    .digest("hex");
}

/** Two uppercase letters from Vercel's geo header, else null (local runs, unknown ranges). */
export function visitorCountry(request: Request) {
  const country = request.headers.get("x-vercel-ip-country")?.trim() ?? "";
  return /^[A-Z]{2}$/.test(country) ? country : null;
}
