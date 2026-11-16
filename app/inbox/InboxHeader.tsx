import { buttonStyles, labelStyle } from "@/app/inbox/styles";

type Props = {
  total: number;
  unread: number;
  replied: number;
  /** True when the list hit the query limit, so the counts cover only what is shown. */
  capped: boolean;
};

export function InboxHeader({ total, unread, replied, capped }: Props) {
  const counts = [
    { label: capped ? "Latest" : "Total", value: total, tone: "text-ink" },
    { label: "New", value: unread, tone: unread > 0 ? "text-accent" : "text-ink" },
    { label: "Replied", value: replied, tone: "text-ink" },
  ];

  return (
    <header>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={labelStyle}>
            Access · <span className="text-accent">Signed in</span>
          </p>
          <h1 className="mt-4 font-display text-3xl tracking-tight text-ink sm:text-4xl">Inbox</h1>
        </div>
        <form method="post" action="/api/inbox/session">
          <input type="hidden" name="intent" value="signout" />
          <button type="submit" className={buttonStyles.default}>
            Sign out
          </button>
        </form>
      </div>

      <dl className="mt-8 grid grid-cols-3 gap-px border border-line bg-line">
        {counts.map(({ label, value, tone }) => (
          <div key={label} className="bg-surface px-4 py-3 sm:px-5 sm:py-4">
            <dt className={labelStyle}>{label}</dt>
            <dd className={`mt-1 font-display text-2xl tabular-nums tracking-tight sm:text-3xl ${tone}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
