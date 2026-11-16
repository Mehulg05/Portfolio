import { labelStyle } from "@/app/inbox/styles";

type Props = {
  /** Env var names only; values never reach the page. */
  missing: string[];
};

export function NotConfigured({ missing }: Props) {
  return (
    <section
      aria-labelledby="inbox-title"
      className="grid grid-cols-1 gap-px border border-line bg-line"
    >
      <div className="bg-surface p-5 sm:p-7">
        <p className={labelStyle}>
          Status · <span className="text-redline">Offline</span>
        </p>
        <h1 id="inbox-title" className="mt-4 font-display text-3xl tracking-tight text-ink sm:text-4xl">
          Inbox
        </h1>
        <p className="mt-3 max-w-[52ch] leading-relaxed text-ink-dim">
          The inbox is not configured on this deployment.
        </p>
      </div>
      <div className="bg-ground p-5 sm:p-7">
        <p className={labelStyle}>Missing environment variables</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {missing.map((name) => (
            <li key={name}>
              <code className="border border-redline/45 px-2 py-1 font-mono text-[12px] text-redline">
                {name}
              </code>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
