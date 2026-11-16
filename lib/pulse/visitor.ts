import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { getDb } from "@/lib/db/client";

/*
  Who a beacon came from, without knowing who that is. Both hashes are keyed with a random
  salt that exists for one UTC day (table pulse_salts) and is deleted once that day is
  over, so "unique visitors" are unique per day and nobody, the owner included, can link a
  visitor across days afterwards. No IP, cookie or client id is stored.

  A view sent just before midnight UTC and its leave beacon just after hash differently,
  so that one leave is dropped. Rare, and the price of a salt that is really gone.
*/

const maxUserAgentLength = 300;

// A warm instance asks the database once per day, not once per beacon.
let cached: { day: string; salt: string } | null = null;

/** Today's date in UTC as YYYY-MM-DD, the same day the database stores in page_views.day. */
function utcDay(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/*
  Insert-or-read, so concurrent instances agree on one salt per day. Yesterday's salts are
  deleted in the same step: the first beacon of a new day is what retires the old key.
*/
async function dailySalt(day: string) {
  if (cached?.day === day) return cached.salt;
  const db = getDb();
  await db`insert into pulse_salts (day, salt) values (${day}, ${randomBytes(32).toString("hex")}) on conflict (day) do nothing`;
  await db`delete from pulse_salts where day < ${day}`;
  const [row] = await db<{ salt: string }[]>`select salt from pulse_salts where day = ${day}`;
  if (!row) throw new Error("No pulse salt for today.");
  cached = { day, salt: row.salt };
  return row.salt;
}

export type BeaconSource = { ip: string; userAgent: string };

export type VisitorKeys = {
  /** ip + user agent: one per browser per day, the unit of "unique visitors". */
  visitorHash: string;
  /** network only: the rate-limit bucket, which a rotating user agent cannot escape. */
  sourceHash: string;
};

/** Read from the request before the response is sent; the hashing itself runs later, in after(). */
export function beaconSource(request: Request, ip: string): BeaconSource {
  return { ip, userAgent: request.headers.get("user-agent")?.slice(0, maxUserAgentLength) ?? "" };
}

export async function visitorKeys(source: BeaconSource, now = new Date()): Promise<VisitorKeys> {
  const salt = await dailySalt(utcDay(now));
  const hash = (value: string) => createHmac("sha256", salt).update(value).digest("hex");
  return { visitorHash: hash(`${source.ip}|${source.userAgent}`), sourceHash: hash(`net|${source.ip}`) };
}

/** Two uppercase letters from Vercel's geo header, else null (local runs, unknown ranges). */
export function visitorCountry(request: Request) {
  const country = request.headers.get("x-vercel-ip-country")?.trim() ?? "";
  return /^[A-Z]{2}$/.test(country) ? country : null;
}
