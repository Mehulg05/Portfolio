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
  if (value === "locked" || value === "code") return value;
  return "wrong";
}

export function SignInFormFromUrl({ emailEnabled }: { emailEnabled: boolean }) {
  const params = useSearchParams();
  return <SignInForm error={toSignInError(params.get("error"))} codeSent={params.get("sent") === "1"} emailEnabled={emailEnabled} />;
}
