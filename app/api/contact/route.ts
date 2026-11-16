import { after } from "next/server";
import { clientIp, hashIp, isTrustedContactOrigin } from "@/lib/contact/abuse";
import { isContactConfigured } from "@/lib/contact/config";
import { notifyOwner } from "@/lib/contact/owner";
import { contactLimits, type ContactErrorCode, type ContactField, type ContactResponse } from "@/lib/contact/types";
import { isHoneypotFilled, validateContact, type ContactSubmission } from "@/lib/contact/validate";
import { insertMessageWithinLimits, markNotified, type SubmissionLimits } from "@/lib/db/messages";
import { errorClass } from "@/lib/http/error";
import { jsonError } from "@/lib/http/response";
import { contentTypeIs, parseJsonSafe, readBodyLimited } from "@/lib/http/request";

// postgres.js and node:crypto need Node, not the edge runtime.
export const runtime = "nodejs";

// The form sends a few hundred bytes; anything near this is not a person typing.
const maxBodyBytes = 16 * 1024;
const maxUserAgentLength = 300;

/*
  Per sender (one IP hash, or one address) and across everyone. The global numbers sit under
  Resend's free 100 emails a day and keep the form from being used to fill the database
  shared with Alpha Academy. A legitimate visitor never comes near them.
*/
const limits: SubmissionLimits = { ipHour: 5, ipDay: 10, emailDay: 3, globalHour: 30, globalDay: 80 };

function reply(status: number, body: ContactResponse) {
  return Response.json(body, { status });
}

function failure(status: number, code: ContactErrorCode, message: string, field?: ContactField) {
  return field ? reply(status, { ok: false, code, message, field }) : jsonError(status, code, message);
}

/*
  A client-reported duration is as forgeable as any other field; it only filters scripts
  that post without loading the page. A missing value means exactly that kind of script.
*/
function isTooFast(elapsedMs: number | null) {
  return elapsedMs === null || elapsedMs < contactLimits.minFillMs;
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
    const sent = await notifyOwner({ name: submission.name, email: submission.email, message: submission.message });
    if (!sent) return;
    try {
      await markNotified(id);
    } catch (error) {
      console.error("contact: could not mark the message as notified.", errorClass(error));
    }
  });
}

export async function POST(request: Request) {
  if (!isContactConfigured()) {
    return failure(503, "unconfigured", "The contact form is not available right now.");
  }

  if (!isTrustedContactOrigin(request)) {
    return failure(403, "forbidden", "This form only accepts messages from the site itself.");
  }

  if (!contentTypeIs(request, "application/json")) return failure(400, "invalid", "The request must be JSON.");
  const text = await readBodyLimited(request, maxBodyBytes);
  if (text === null) return failure(400, "invalid", "The message is too large to send.");
  const parsed = parseJsonSafe(text);
  if (!parsed.ok) return failure(400, "invalid", "The request could not be read.");

  // Same answer a person gets, so the bot learns nothing and does not retry with a fix.
  if (isHoneypotFilled(parsed.value)) {
    console.info("contact: honeypot filled, dropping the submission.");
    return reply(200, { ok: true });
  }

  const result = validateContact(parsed.value, contactLimits);
  if (!result.ok) return failure(400, "invalid", result.message, result.field);
  const submission = result.value;

  if (isTooFast(submission.elapsedMs)) {
    return failure(400, "too_fast", "That was quick. Please wait a moment and send again.");
  }

  let id: string;
  try {
    const result = await insertMessageWithinLimits(
      {
        name: submission.name,
        email: submission.email,
        message: submission.message,
        ipHash: hashIp(clientIp(request)),
        userAgent: userAgent(request),
      },
      limits,
    );
    if (!result.ok) {
      return jsonError(429, "rate_limited", "Too many messages for now. Please try again later.", {
        "Retry-After": String(result.retryAfterSeconds),
      });
    }
    id = result.id;
  } catch (error) {
    // The driver's error can carry the submission itself; only its class is logged.
    console.error("contact: database error.", errorClass(error));
    return failure(500, "server_error", "Something went wrong saving your message. Please try again.");
  }

  notifyLater(id, submission);
  return reply(200, { ok: true });
}
