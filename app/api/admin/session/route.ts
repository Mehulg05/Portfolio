import { NextResponse } from "next/server";
import {
  INBOX_COOKIE,
  INBOX_SESSION_MAX_AGE_SECONDS,
  checkSecret,
  createSessionValue,
  isAdminConfigured,
  isSameOriginOrUnspecified,
} from "@/lib/admin/auth";

// node:crypto for the HMAC and timingSafeEqual.
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

// 303 so the browser follows with a GET; a plain HTML form post never lands on JSON.
function redirectTo(path: string, request: Request) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

async function readForm(request: Request) {
  try {
    return await request.formData();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!isSameOriginOrUnspecified(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const form = await readForm(request);

  if (form?.get("intent") === "signout") {
    const response = redirectTo("/", request);
    response.cookies.set(INBOX_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return response;
  }

  // The page explains which env vars are missing; there is nothing to check against.
  if (!isAdminConfigured()) return redirectTo("/", request);

  const secret = form?.get("secret");
  if (typeof secret !== "string" || secret.length > MAX_SECRET_LENGTH || !checkSecret(secret)) {
    // A 32-byte random secret already makes brute force pointless; the delay only keeps
    // scripted guessing slow enough that it does not flood the logs.
    await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
    return redirectTo("/?error=1", request);
  }

  const response = redirectTo("/", request);
  response.cookies.set(INBOX_COOKIE, createSessionValue(Date.now()), {
    ...cookieOptions,
    maxAge: INBOX_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
