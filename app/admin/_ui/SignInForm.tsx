import { PendingForm } from "@/app/admin/_ui/PendingForm";
import { buttonStyles, labelStyle } from "@/app/admin/_ui/styles";

export type SignInError = "wrong" | "code" | "locked" | null;

const errorCopy: Record<Exclude<SignInError, null>, string> = {
  wrong: "That secret did not match.",
  code: "That code is wrong, expired or already used. Request a new one.",
  locked: "Too many attempts. Try again in a minute.",
};

type Props = {
  error: SignInError;
  /** A code request was just made (the answer is the same whether or not one went out). */
  codeSent: boolean;
  /** RESEND_API_KEY is set: codes can be emailed, and the secret becomes a recovery path. */
  emailEnabled: boolean;
};

/*
  Plain forms posting to the session route, which answers with a 303 back to /. Works
  with JavaScript off: state arrives as ?sent= and ?error= on the redirect and is rendered
  on the server, because the admin routes are always dynamic.
*/
export function SignInForm({ error, codeSent, emailEnabled }: Props) {
  return (
    <div className="px-5 pt-6 pb-7 sm:px-7">
      <h1 id="admin-signin-title" className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Sign in
      </h1>
      {emailEnabled ? (
        <>
          <p className="mt-2 max-w-[38ch] text-[15px] leading-relaxed text-ink-dim">
            One owner. A one-time code goes to the owner&apos;s inbox, nowhere else.
          </p>
          <CodeSection error={error} codeSent={codeSent} />
          <details className="mt-7 border-t border-line pt-4" open={error === "wrong"}>
            <summary className={`${labelStyle} min-h-11 cursor-pointer py-3 hover:text-accent focus-visible:text-accent`}>
              Use recovery key
            </summary>
            <SecretForm error={error === "wrong" ? error : null} />
          </details>
        </>
      ) : (
        <>
          <p className="mt-2 max-w-[38ch] text-[15px] leading-relaxed text-ink-dim">
            One owner, one secret. Messages, traffic and health live behind it.
          </p>
          <p
            role="note"
            className="mt-5 border-l border-line-bright pl-3 font-mono text-[12px] leading-relaxed text-ink-dim"
          >
            Emailed codes are off because RESEND_API_KEY is not set. Signing in with the recovery key (INBOX_SECRET) until it is.
          </p>
          <SecretForm error={error === "locked" || error === "wrong" ? error : null} />
        </>
      )}
    </div>
  );
}

function ErrorLine({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-3 border-l border-redline pl-3 font-mono text-[12px] leading-relaxed text-redline">
      {children}
    </p>
  );
}

function CodeSection({ error, codeSent }: { error: SignInError; codeSent: boolean }) {
  const showCodeField = codeSent || error === "code";
  const errorId = error === "code" || error === "locked" ? "admin-code-error" : undefined;

  return (
    <div className="mt-7">
      <PendingForm
        action="/api/admin/session"
        intent="request-code"
        variant={showCodeField ? "default" : "accentBlock"}
        label={showCodeField ? "Email me a new code" : "Email me a code"}
        pendingLabel="Sending…"
        className="[&>button]:mt-0"
      />

      {codeSent && !error ? (
        <p role="status" className="mt-4 font-mono text-[12px] leading-relaxed text-ink-dim">
          If a code could be sent, it is on its way. It expires in 10 minutes.
        </p>
      ) : null}

      {showCodeField ? (
        <PendingForm
          action="/api/admin/session"
          intent="verify-code"
          variant="accentBlock"
          label="Sign in"
          pendingLabel="Checking…"
          className="mt-6 [&>button]:mt-6"
        >
          <label htmlFor="admin-code" className={`${labelStyle} block`}>
            6-digit code
          </label>
          <input
            id="admin-code"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            autoComplete="one-time-code"
            spellCheck={false}
            aria-invalid={error === "code" ? true : undefined}
            aria-describedby={errorId}
            className="mt-2.5 block min-h-11 w-full border border-line-bright bg-ground px-3 py-2 font-mono text-lg tracking-[0.4em] text-ink focus-visible:border-accent aria-[invalid=true]:border-redline"
          />
          {errorId && error ? <ErrorLine id={errorId}>{errorCopy[error]}</ErrorLine> : null}
        </PendingForm>
      ) : null}
    </div>
  );
}

function SecretForm({ error }: { error: SignInError }) {
  const errorId = error ? "admin-secret-error" : undefined;

  return (
    <form method="post" action="/api/admin/session">
      <input type="hidden" name="intent" value="password" />
      {/* Lets password managers file the secret under a stable account name. */}
      <input type="text" name="username" value="owner" autoComplete="username" readOnly hidden />

      <label htmlFor="admin-secret" className={`${labelStyle} mt-4 block`}>
        Secret
      </label>
      <input
        id="admin-secret"
        name="secret"
        type="password"
        required
        // After a wrong or locked attempt the page reloads; put the cursor back where the fix goes.
        autoFocus={error !== null}
        maxLength={512}
        autoComplete="current-password"
        spellCheck={false}
        aria-invalid={error === "wrong" ? true : undefined}
        aria-describedby={errorId}
        className="mt-2.5 block min-h-11 w-full border border-line-bright bg-ground px-3 py-2 font-mono text-sm text-ink focus-visible:border-accent aria-[invalid=true]:border-redline"
      />
      {error ? <ErrorLine id="admin-secret-error">{errorCopy[error]}</ErrorLine> : null}

      <button type="submit" className={`${buttonStyles.accentBlock} mt-6`}>
        Sign in
      </button>
    </form>
  );
}
