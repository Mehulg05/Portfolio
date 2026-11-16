import { after } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { clientIp } from "@/lib/contact/abuse";
import { isDatabaseConfigured } from "@/lib/db/client";
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
*/
const viewWindow = { seconds: 60 * 60, perVisitor: 60, perSource: 240 };
const retentionDays = 90;
const pruneChance = 0.01;

function noContent() {
  return new Response(null, { status: 204 });
}

function hostnameOf(hostHeader: string | null) {
  const host = hostHeader?.trim().toLowerCase() ?? "";
  // IPv6 hosts arrive bracketed with an optional port: [::1]:3000.
  if (host.startsWith("[")) return host.slice(1, host.indexOf("]"));
  return host.split(":")[0] ?? "";
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

// sendBeacon with a Blob sends its type; a plain string body arrives as text/plain.
function hasAcceptedType(request: Request) {
  const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  return type === "application/json" || type === "text/plain";
}

/**
 * The body as text, or null when it is too large. Reads the stream itself and stops at the
 * limit, because a chunked upload has no Content-Length and request.text() would buffer it all.
 */
async function readBody(request: Request) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBodyBytes) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBodyBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function readEvent(request: Request) {
  if (!hasAcceptedType(request)) return null;
  const text = await readBody(request);
  if (text === null) return null;
  const result = validatePulse(parseJson(text));
  return result.ok ? result.value : null;
}

async function store(event: PulseEvent, source: BeaconSource, country: string | null) {
  const keys = await visitorKeys(source);
  if (event.kind === "leave") {
    await recordLeave(event, keys.visitorHash);
    return;
  }
  const recent = await countRecentViews(keys, viewWindow.seconds);
  if (recent.visitor >= viewWindow.perVisitor || recent.source >= viewWindow.perSource) return;
  await insertPageView({ ...event, ...keys, country });
}

// Error objects from postgres.js carry the query parameters; the message alone is enough.
function logFailure(action: string, error: unknown) {
  console.error(`pulse: could not ${action}.`, error instanceof Error ? error.message : "unknown error");
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
        await pruneOldPageViews(retentionDays);
      } catch (error) {
        logFailure("prune old page views", error);
      }
    }
  });

  return noContent();
}
