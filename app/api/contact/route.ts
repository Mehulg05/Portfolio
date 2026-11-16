import { after } from "next/server";
import { clientIp, hashIp, isSameOrigin } from "@/lib/contact/abuse";
import { isContactConfigured } from "@/lib/contact/config";
import { sendNotification } from "@/lib/contact/notify";
import { contactLimits, type ContactErrorCode, type ContactField, type ContactResponse } from "@/lib/contact/types";
import { validateContact, type ContactSubmission } from "@/lib/contact/validate";
import { profile } from "@/lib/content/profile";
import { countRecentByEmail, countRecentByIp, insertMessage, markNotified } from "@/lib/db/messages";
import { siteUrl } from "@/lib/site";

// postgres.js and node:crypto need Node, not the edge runtime.
export const runtime = "nodejs";

// The form sends a few hundred bytes; anything near this is not a person typing.
const maxBodyBytes = 16 * 1024;
const maxUserAgentLength = 300;

const ipWindow = { seconds: 60 * 60, max: 5 };
const emailWindow = { seconds: 24 * 60 * 60, max: 3 };

function reply(status: number, body: ContactResponse, headers?: HeadersInit) {
  return Response.json(body, { status, headers });
}

function failure(status: number, code: ContactErrorCode, message: string, field?: ContactField) {
  return reply(status, field ? { ok: false, code, message, field } : { ok: false, code, message });
}

function isJson(request: Request) {
  const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  return type === "application/json";
}

/** The body as text, or null when it is too large. Checks the header first to skip reading obvious floods. */
async function readBody(request: Request) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBodyBytes) return null;
  const text = await request.text();
  return Buffer.byteLength(text, "utf8") > maxBodyBytes ? null : text;
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

/*
  A client-reported duration is as forgeable as any other field; it only filters scripts
  that post without loading the page. A missing value means exactly that kind of script.
*/
function isTooFast(elapsedMs: number | null) {
  return elapsedMs === null || elapsedMs < contactLimits.minFillMs;
}

/*
  Count-then-insert is not atomic: concurrent requests from one IP can all read a count of
  4 and all insert, overshooting the limit by the number of requests in flight. That is
  acceptable here: the limit exists to stop a form being used as a spam cannon, a handful of
  extra rows does not defeat it, and an exact limit would need a lock or a counter table
  for a form that gets a few messages a week.

  Returns the Retry-After seconds when a window is full. That is the window length, an
  upper bound rather than the exact moment the oldest row expires, which keeps it to one query.
*/
async function rateLimitRetryAfter(ipHash: string, email: string) {
  if ((await countRecentByIp(ipHash, ipWindow.seconds)) >= ipWindow.max) return ipWindow.seconds;
  if ((await countRecentByEmail(email, emailWindow.seconds)) >= emailWindow.max) return emailWindow.seconds;
  return null;
}

function userAgent(request: Request) {
  return request.headers.get("user-agent")?.slice(0, maxUserAgentLength) || null;
}

/*
  Runs after the response is sent, so a slow or failing Resend never delays the person
  submitting. notified_at is only set when the email was accepted; a null value in the
  inbox means "you were not told about this one".
*/
function notifyLater(id: string, submission: ContactSubmission) {
  after(async () => {
    const sent = await sendNotification({
      name: submission.name,
      email: submission.email,
      message: submission.message,
      // An empty value left in the dashboard should fall back too, hence || over ??.
      to: process.env.CONTACT_TO_EMAIL || profile.email,
      inboxUrl: `${siteUrl}/inbox`,
    });
    if (!sent) return;
    try {
      await markNotified(id);
    } catch (error) {
      console.error("contact: could not mark the message as notified.", error);
    }
  });
}

export async function POST(request: Request) {
  if (!isContactConfigured()) {
    return failure(503, "unconfigured", "The contact form is not available right now.");
  }

  if (!isSameOrigin(request)) {
    return failure(403, "forbidden", "This form only accepts messages from the site itself.");
  }

  if (!isJson(request)) return failure(400, "invalid", "The request must be JSON.");
  const text = await readBody(request);
  if (text === null) return failure(400, "invalid", "The message is too large to send.");
  const parsed = parseJson(text);
  if (!parsed.ok) return failure(400, "invalid", "The request could not be read.");

  const result = validateContact(parsed.value, contactLimits);
  if (!result.ok) return failure(400, "invalid", result.message, result.field);
  const submission = result.value;

  // Same answer a person gets, so the bot learns nothing and does not retry with a fix.
  if (submission.website) {
    console.info("contact: honeypot filled, dropping the submission.");
    return reply(200, { ok: true });
  }

  if (isTooFast(submission.elapsedMs)) {
    return failure(400, "too_fast", "That was quick. Please wait a moment and send again.");
  }

  let id: string;
  try {
    const ipHash = hashIp(clientIp(request));
    const retryAfter = await rateLimitRetryAfter(ipHash, submission.email);
    if (retryAfter !== null) {
      return reply(
        429,
        { ok: false, code: "rate_limited", message: "Too many messages for now. Please try again later." },
        { "Retry-After": String(retryAfter) },
      );
    }
    id = await insertMessage({
      name: submission.name,
      email: submission.email,
      message: submission.message,
      ipHash,
      userAgent: userAgent(request),
    });
  } catch (error) {
    console.error("contact: database error.", error);
    return failure(500, "server_error", "Something went wrong saving your message. Please try again.");
  }

  notifyLater(id, submission);
  return reply(200, { ok: true });
}
