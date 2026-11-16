import { buttonStyles, labelStyle } from "@/app/admin/_ui/styles";

export type SignInError = "wrong" | "locked" | null;

const errorCopy: Record<Exclude<SignInError, null>, string> = {
  wrong: "That secret did not match.",
  locked: "Too many attempts. Try again in 15 minutes.",
};

type Props = {
  error: SignInError;
};

/*
  A plain form posting to the session route, which answers with a 303 back to /. Works
  with JavaScript off: the error arrives as ?error= on the redirect and is rendered on
  the server, because the admin routes are always dynamic.
*/
export function SignInForm({ error }: Props) {
  const errorId = error ? "admin-secret-error" : undefined;

  return (
    <form method="post" action="/api/admin/session" className="px-5 pt-6 pb-7 sm:px-7">
      <h1 id="admin-signin-title" className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Sign in
      </h1>
      <p className="mt-2 max-w-[38ch] text-[15px] leading-relaxed text-ink-dim">
        One owner, one secret. Messages, traffic and health live behind it.
      </p>

      {/* Lets password managers file the secret under a stable account name. */}
      <input type="text" name="username" value="owner" autoComplete="username" readOnly hidden />

      <label htmlFor="admin-secret" className={`${labelStyle} mt-7 block`}>
        Secret
      </label>
      <input
        id="admin-secret"
        name="secret"
        type="password"
        required
        maxLength={512}
        autoComplete="current-password"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className="mt-2.5 block min-h-11 w-full border border-line-bright bg-ground px-3 py-2 font-mono text-sm text-ink focus-visible:border-accent aria-[invalid=true]:border-redline"
      />
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-3 border-l border-redline pl-3 font-mono text-[12px] leading-relaxed text-redline"
        >
          {errorCopy[error]}
        </p>
      ) : null}

      <button type="submit" className={`${buttonStyles.accentBlock} mt-6`}>
        Sign in
      </button>
    </form>
  );
}
