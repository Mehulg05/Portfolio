import type { Ref } from "react";

export const notConfiguredReason = "The form is offline right now.";
export const needsScriptReason = "The form needs JavaScript to send.";

/*
  What shows in place of the form whenever the form cannot work: no database on this
  build, the API saying so at runtime, or no JavaScript. No hooks and no directive, so the
  server section and the client form render the same markup.
*/
export function ContactEmailNote({
  email,
  reason,
  ref,
}: {
  email: string;
  reason: string;
  /** The client form moves focus here when the form disappears under the visitor. */
  ref?: Ref<HTMLParagraphElement>;
}) {
  return (
    <p
      ref={ref}
      tabIndex={ref ? -1 : undefined}
      className="border-l-2 border-line-bright pl-3 text-sm leading-relaxed text-ink-dim focus:outline-none"
    >
      {reason} Email me instead:{" "}
      <a href={`mailto:${email}`} className="break-all text-accent hover:underline">
        {email}
      </a>
    </p>
  );
}
