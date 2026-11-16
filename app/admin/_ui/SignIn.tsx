import { Suspense } from "react";
import { SignInForm } from "@/app/admin/_ui/SignInForm";
import { SignInFormFromUrl } from "@/app/admin/_ui/SignInFormFromUrl";
import { labelStyle } from "@/app/admin/_ui/styles";

type Props = {
  /** Passed from the server: ADMIN_HOST is not exposed to the client bundle. */
  host: string;
  sessionDays: number;
  failureLimit: number;
  windowMinutes: number;
};

/*
  Laid out like a drawing sheet: a header strip naming the sheet, the form as the body,
  and a title block stating the facts of the access path (where, how, how often).
*/
export function SignIn({ host, sessionDays, failureLimit, windowMinutes }: Props) {
  return (
    <section
      aria-labelledby="admin-signin-title"
      className="tick-frame w-full max-w-[26rem] border border-line bg-surface"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5 sm:px-7">
        <p className={labelStyle}>Sheet · Admin access</p>
        <p className={labelStyle}>
          <span className="text-redline">Signed out</span>
        </p>
      </div>

      <Suspense fallback={<SignInForm error={null} />}>
        <SignInFormFromUrl />
      </Suspense>

      <dl className="grid grid-cols-2 gap-px border-t border-line bg-line">
        <TitleCell label="Host" wide>
          <span className="break-all">{host}</span>
        </TitleCell>
        <TitleCell label="Auth">signed cookie, {sessionDays} d</TitleCell>
        <TitleCell label="Throttle">
          {failureLimit} fails / {windowMinutes} min
        </TitleCell>
      </dl>
    </section>
  );
}

function TitleCell({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`bg-ground px-5 py-3 sm:px-7 ${wide ? "col-span-2" : ""}`}>
      <dt className={labelStyle}>{label}</dt>
      <dd className="mt-1 font-mono text-[12px] text-ink-dim tabular-nums">{children}</dd>
    </div>
  );
}
