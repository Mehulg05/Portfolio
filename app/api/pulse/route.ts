import { after } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { clientIp } from "@/lib/contact/abuse";
import { sections as pageSections } from "@/lib/content/sections";
import { isDatabaseConfigured } from "@/lib/db/client";
import { PAGE_VIEW_RETENTION_DAYS } from "@/lib/db/retention";
import { errorClass } from "@/lib/http/error";
import { contentTypeIs, hostnameOf, parseJsonSafe, readBodyLimited } from "@/lib/http/request";
import { countRecentViews, insertPageView, pruneOldPageViews, recordLeave } from "@/lib/pulse/db";
import { validatePulse, type PulseEvent } from "@/lib/pulse/validate";
import { beaconSource, visitorCountry, visitorKeys, type BeaconSource } from "@/lib/pulse/visitor";

// postgres.js and node:crypto need Node, not the edge runtime.
export const runtime = "nodejs";

/*
  The page beacon. Every request gets the same empty 204, accepted or not, and the
  database work runs after the response, so neither the status nor the timing tells a
  script whether its beacon counted.
*/

// A real beacon is about 250 bytes.
const maxBodyBytes = 4 * 1024;

/*
  Views per hour, limited twice: per visitor (ip + user agent) and per source network
  (ip alone, IPv6 as its /64), so rotating the user agent does not buy a fresh bucket. The
  source cap is higher because an office or a phone carrier puts many people behind one
  address. A leave updates the row its view created and never inserts, so a script that
  floods leaves can only rewrite its own rows (the update matches on visitor_hash).
  Count-then-insert can overshoot by the requests in flight, fine for a counter nobody bills on.

  The global ceilings are what protect the Neon project shared with another app: whatever a
  script does, page_views gains at most globalDay rows a day, about 90 days of them at rest.
*/
const viewWindow = { seconds: 60 * 60, perVisitor: 30, perSource: 60, globalHour: 300, globalDay: 3000 };
const knownSections = new Set<string>(pageSections.map((section) => section.id));
const pruneChance = 0.01;

function noContent() {
  return new Response(null, { status: 204 });
}

function isLocalHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  );
}

/*
  Beacons only count from the public site. Local runs would fill the chart with my own
  reloads, so they are opt-in via PULSE_DEV. A browser posting from another site sends
  Sec-Fetch-Site or an Origin that does not match; curl sends neither and is let through,
  which the per-visitor limit bounds.
*/
function isCountedRequest(request: Request) {
  // The client already sends nothing under DNT or GPC; this covers stale bundles and hand-made requests.
  if (request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1") return false;
  const hostHeader = request.headers.get("host");
  if (isAdminHost(hostHeader)) return false;
  const hostname = hostnameOf(hostHeader);
  if (isLocalHost(hostname) && process.env.PULSE_DEV !== "1") return false;

  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = request.headers.get("origin");
  if (origin && originHost(origin) !== hostHeader?.trim().toLowerCase()) return false;
  return true;
}

function originHost(origin: string) {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

async function readEvent(request: Request) {
  // sendBeacon with a Blob sends its type; a plain string body arrives as text/plain.
  if (!contentTypeIs(request, "application/json", "text/plain")) return null;
  const text = await readBodyLimited(request, maxBodyBytes);
  if (text === null) return null;
  const parsed = parseJsonSafe(text);
  const result = validatePulse(parsed.ok ? parsed.value : undefined);
  if (!result.ok) return null;
  const event = result.value;
  // Only sections the page actually has: anything else is a script padding the column.
  return event.kind === "leave"
    ? { ...event, sections: event.sections.filter((id) => knownSections.has(id)) }
    : event;
}

async function store(event: PulseEvent, source: BeaconSource, country: string | null) {
  const keys = await visitorKeys(source);
  if (event.kind === "leave") {
    await recordLeave(event, keys.visitorHash);
    return;
  }
  const recent = await countRecentViews(keys, viewWindow.seconds);
  if (recent.visitor >= viewWindow.perVisitor || recent.source >= viewWindow.perSource) return;
  if (recent.globalHour >= viewWindow.globalHour || recent.globalDay >= viewWindow.globalDay) return;
  await insertPageView({ ...event, ...keys, country });
}

// Error objects from postgres.js carry the query parameters; the class and code are enough.
function logFailure(action: string, error: unknown) {
  console.error(`pulse: could not ${action}.`, errorClass(error));
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured() || !isCountedRequest(request)) return noContent();

  const event = await readEvent(request);
  if (!event) return noContent();
  const source = beaconSource(request, clientIp(request));
  const country = visitorCountry(request);

  after(async () => {
    try {
      await store(event, source, country);
    } catch (error) {
      logFailure("record a beacon", error);
    }
    // Keeps the table bounded without a cron job; scripts/db-prune.mjs does the same by hand.
    if (Math.random() < pruneChance) {
      try {
        await pruneOldPageViews(PAGE_VIEW_RETENTION_DAYS);
      } catch (error) {
        logFailure("prune old page views", error);
      }
    }
  });

  return noContent();
}
