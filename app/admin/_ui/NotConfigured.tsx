import { labelStyle } from "@/app/admin/_ui/styles";

type Props = {
  /** Env var names only; values never reach the page. */
  missing: string[];
};

const hints: Record<string, string> = {
  INBOX_SECRET: "At least 32 characters. openssl rand -hex 32",
  DATABASE_URL: "Postgres connection string (Neon pooled endpoint)",
  IP_HASH_SALT: "Keys the IP hashes the sign-in throttle counts by",
};

export function NotConfigured({ missing }: Props) {
  return (
    <section
      aria-labelledby="admin-offline-title"
      className="tick-frame w-full max-w-[30rem] border border-line bg-surface"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5 sm:px-7">
        <p className={labelStyle}>Sheet · Admin access</p>
        <p className={labelStyle}>
          <span className="text-redline">Offline</span>
        </p>
      </div>

      <div className="px-5 pt-6 pb-7 sm:px-7">
        <h1 id="admin-offline-title" className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
          Not configured
        </h1>
        <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-ink-dim">
          The admin panel stays closed on this deployment until these environment variables
          are set. Sign-in is not offered without them.
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-px border-t border-line bg-line">
        {missing.map((name) => (
          <div key={name} className="bg-ground px-5 py-3 sm:px-7">
            <dt className="font-mono text-[12px] text-redline">{name}</dt>
            <dd className="mt-1 font-mono text-[11px] text-ink-faint">{hints[name] ?? "Required"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
