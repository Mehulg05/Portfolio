import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  checkSecret,
  createSessionValue,
  isAdminConfigured,
  isSameOriginOrUnspecified,
} from "@/lib/admin/auth";
import {
  LOGIN_FAILURE_LIMIT,
  LOGIN_WINDOW_SECONDS,
  countRecentFailures,
  recordLoginAttempt,
} from "@/lib/admin/login-attempts";
import { clientIp, hashIp, isIpHashConfigured } from "@/lib/contact/abuse";
import { isDatabaseConfigured } from "@/lib/db/client";

// node:crypto for the HMAC and timingSafeEqual, TCP for postgres.js.
export const runtime = "nodejs";

const FAILURE_DELAY_MS = 400;
// Far above any real secret; stops a huge body from being hashed for nothing.
const MAX_SECRET_LENGTH = 512;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  // Browsers drop Secure cookies on plain http://localhost, which would make dev sign-in impossible.
  secure: process.env.NODE_ENV === "production",
} as const;

/*
  303 so the browser follows with a GET; a plain HTML form post never lands on JSON.
  The Location is relative on purpose: the browser resolves it against the admin URL it
  actually posted to, whereas `request.url` can carry another origin (next dev reports
  localhost whatever the Host header says; a proxy can report its internal one).
*/
function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

function failureDelay() {
  return new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
}

async function readForm(request: Request) {
  try {
    return await request.formData();
  } catch {
    return null;
  }
}

/*
  The throttle is defence in depth behind a 32+ character random secret, so a database
  error fails open (logged) rather than locking the owner out of the health page during
  the very outage they are trying to diagnose.
*/
async function isLockedOut(ipHash: string) {
  try {
    return (await countRecentFailures(ipHash, LOGIN_WINDOW_SECONDS)) >= LOGIN_FAILURE_LIMIT;
  } catch (error) {
    console.error("[admin] counting sign-in failures failed", error);
    return false;
  }
}

async function record(ipHash: string, succeeded: boolean) {
  try {
    await recordLoginAttempt(ipHash, succeeded);
  } catch (error) {
    console.error("[admin] recording a sign-in attempt failed", error);
  }
}

function signOut() {
  const response = redirectTo("/");
  response.cookies.set(ADMIN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}

export async function POST(request: Request) {
  if (!isSameOriginOrUnspecified(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const form = await readForm(request);
  if (form?.get("intent") === "signout") return signOut();

  // The layout explains which env vars are missing; there is nothing to check against.
  if (!isAdminConfigured() || !isDatabaseConfigured() || !isIpHashConfigured()) {
    return redirectTo("/");
  }

  const ipHash = hashIp(clientIp(request));

  // Refused before the secret is looked at, so a locked-out guesser learns nothing, and
  // still recorded, so hammering through the lockout keeps extending it.
  if (await isLockedOut(ipHash)) {
    await record(ipHash, false);
    await failureDelay();
    return redirectTo("/?error=locked");
  }

  const secret = form?.get("secret");
  if (typeof secret !== "string" || secret.length > MAX_SECRET_LENGTH || !checkSecret(secret)) {
    await record(ipHash, false);
    // Keeps scripted guessing slow even below the lockout threshold.
    await failureDelay();
    return redirectTo("/?error=1");
  }

  await record(ipHash, true);

  const response = redirectTo("/");
  response.cookies.set(ADMIN_COOKIE, createSessionValue(Date.now()), {
    ...cookieOptions,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
