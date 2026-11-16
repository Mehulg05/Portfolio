import { buttonStyles, labelStyle } from "@/app/inbox/styles";

type Props = {
  failed: boolean;
};

/*
  A plain form posting to the session route, which answers with a 303 back here. No
  client JS: the error state arrives as ?error=1 on the redirect.
*/
export function SignIn({ failed }: Props) {
  return (
    <section
      aria-labelledby="inbox-title"
      className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-[1fr_1.2fr]"
    >
      <div className="bg-surface p-5 sm:p-7">
        <p className={labelStyle}>
          Access · <span className="text-accent">Restricted</span>
        </p>
        <h1 id="inbox-title" className="mt-4 font-display text-3xl tracking-tight text-ink sm:text-4xl">
          Inbox
        </h1>
        <p className="mt-3 max-w-[40ch] leading-relaxed text-ink-dim">
          Messages from the contact form. Only the site owner can read them.
        </p>
      </div>

      <form method="post" action="/api/inbox/session" className="bg-ground p-5 sm:p-7">
        <label htmlFor="inbox-secret" className={labelStyle}>
          Secret
        </label>
        <input
          id="inbox-secret"
          name="secret"
          type="password"
          required
          autoComplete="current-password"
          spellCheck={false}
          aria-invalid={failed || undefined}
          aria-describedby={failed ? "inbox-secret-error" : undefined}
          className="mt-3 block min-h-11 w-full border border-line-bright bg-surface px-3 py-2 font-mono text-sm text-ink focus:border-accent aria-[invalid=true]:border-redline"
        />
        {failed ? (
          <p
            id="inbox-secret-error"
            role="alert"
            className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-redline"
          >
            That secret did not match
          </p>
        ) : null}
        <div className="mt-5">
          <button type="submit" className={buttonStyles.accent}>
            Sign in
          </button>
        </div>
      </form>
    </section>
  );
}
