"use client";

import { useSearchParams } from "next/navigation";
import { SignInForm, type SignInError } from "@/app/admin/_ui/SignInForm";

/*
  Layouts cannot read searchParams, and the sign-in screen is rendered by the admin
  layout. On a dynamic route this hook resolves during the server render with the real
  query, so the error still reaches the HTML without client JavaScript.
*/
function toSignInError(value: string | null): SignInError {
  if (value === null) return null;
  return value === "locked" ? "locked" : "wrong";
}

export function SignInFormFromUrl() {
  const error = toSignInError(useSearchParams().get("error"));
  return <SignInForm error={error} />;
}
