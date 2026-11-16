import type { Metadata } from "next";
import type { ReactNode } from "react";
import { formatCount, plural } from "@/app/admin/_charts/format";
import { PageHeader, Panel, Stat, StatGrid, monoLabel } from "@/app/admin/_charts/Panel";
import { formatAbsoluteTime } from "@/app/admin/_ui/relative-time";
import { buttonStyles } from "@/app/admin/_ui/styles";
import { hasAdminSession } from "@/lib/admin/auth";
import {
  getHealth,
  type DeployInfo,
  type EnvCheck,
  type Health,
  type MigrationState,
  type NotificationState,
  type Probe,
} from "@/lib/admin/health";
import { RETRY_LIMIT } from "@/lib/admin/maintenance";

// Every number here is a live probe; caching it would defeat the page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Health" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type RetryOutcome = { kind: "done"; sent: number; tried: number } | { kind: "error" };

function parseRetried(value: string | string[] | undefined): RetryOutcome | null {
  if (typeof value !== "string") return null;
  if (value === "error") return { kind: "error" };
  const match = /^(\d{1,3})\/(\d{1,3})$/.exec(value);
  return match ? { kind: "done", sent: Number(match[1]), tried: Number(match[2]) } : null;
}

function RetryBanner({ outcome, resendConfigured }: { outcome: RetryOutcome; resendConfigured: boolean }) {
  let message: string;
  let failed = false;
  if (outcome.kind === "error") {
    message = "The retry failed before sending. Check the server logs.";
    failed = true;
  } else if (outcome.tried === 0) {
    message = resendConfigured ? "Nothing to retry: every open message has been notified." : "Resend is not configured, so nothing was sent.";
  } else {
    message = `Sent ${outcome.sent} of ${plural(outcome.tried, "pending notification")}.`;
    failed = outcome.sent < outcome.tried;
  }
  return (
    <p
      role="status"
      className={`mb-4 border bg-ground p-4 font-mono text-[12px] sm:mb-6 ${failed ? "border-redline/45 text-redline" : "border-accent/45 text-accent"}`}
    >
      {message}
    </p>
  );
}

function Tag({ children, tone }: { children: ReactNode; tone: "ok" | "bad" | "faint" }) {
  const tones = {
    ok: "border-line-bright text-ink-dim",
    bad: "border-redline/60 text-redline",
    faint: "border-line text-ink-faint",
  } as const;
  return (
    <span className={`shrink-0 border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

function latencyCell(db: Health["db"]) {
  if (!db.ok) return <Stat label="Database" value="down" tone="redline" detail={db.error} />;
  return (
    <Stat
      label="DB round trip"
      value={
        <>
          {db.value.warmMs.toFixed(1)}
          <span className="ml-1 font-mono text-[11px] text-ink-faint">ms</span>
        </>
      }
      detail={`first query ${db.value.firstMs.toFixed(1)} ms`}
    />
  );
}

function migrationCell(migrations: Probe<MigrationState>) {
  if (!migrations.ok) return <Stat label="Migrations" value="unknown" tone="redline" detail={migrations.error} />;
  const { latest, applied, expected, pending } = migrations.value;
  const value = <span className="block truncate font-mono text-[15px]">{latest ?? "none"}</span>;
  if (expected === null) return <Stat label="Latest migration" value={value} detail="migration files not in bundle" />;
  if (pending.length > 0) {
    return <Stat label="Latest migration" value={value} tone="redline" detail={`behind: ${pending.length} pending`} />;
  }
  return <Stat label="Latest migration" value={value} detail={`${applied.length} of ${expected.length} applied`} />;
}

function notificationCell(notifications: Probe<NotificationState>) {
  if (!notifications.ok) return <Stat label="Unnotified" value="unknown" tone="redline" detail={notifications.error} />;
  const { unnotified, retryable } = notifications.value;
  return (
    <Stat
      label="Unnotified"
      value={formatCount(unnotified)}
      tone={retryable > 0 ? "redline" : "ink"}
      detail={`${formatCount(retryable)} not archived`}
    />
  );
}

function deployCell(deploy: DeployInfo) {
  return (
    <Stat
      label="Deploy"
      value={deploy.env}
      tone={deploy.env === "production" ? "accent" : "ink"}
      detail={deploy.region ?? "no region"}
    />
  );
}

function EnvRow({ check }: { check: EnvCheck }) {
  let tag: ReactNode;
  if (check.state === "set") tag = <Tag tone="ok">set</Tag>;
  else if (check.state === "short") tag = <Tag tone="bad">too short</Tag>;
  else tag = check.required ? <Tag tone="bad">missing</Tag> : <Tag tone="faint">not set</Tag>;

  return (
    <li className="flex items-start justify-between gap-3 py-2.5">
      <span className="min-w-0">
        <span className="block break-all font-mono text-[12px] text-ink">{check.name}</span>
        <span className="mt-0.5 block text-[12px] text-ink-faint">
          {check.purpose}
          {check.required ? null : " (optional)"}
        </span>
      </span>
      {tag}
    </li>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <dt className={monoLabel}>{label}</dt>
      <dd className="min-w-0 break-words font-mono text-[12px] text-ink tabular-nums">{children}</dd>
    </div>
  );
}

function DeployPanel({ health }: { health: Health }) {
  const { deploy } = health;
  return (
    <Panel id="deploy" title="Deploy and runtime">
      <dl className="divide-y divide-line">
        <Row label="Environment">{deploy.env}</Row>
        <Row label="Region">{deploy.region ?? <span className="text-ink-faint">n/a</span>}</Row>
        <Row label="Commit">
          {deploy.sha && deploy.commitUrl ? (
            <a href={deploy.commitUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              {deploy.sha.slice(0, 7)} ↗
            </a>
          ) : (
            <span className="text-ink-faint">local</span>
          )}
        </Row>
        {deploy.message ? <Row label="Message">{deploy.message}</Row> : null}
        <Row label="Node">{health.node}</Row>
        <Row label="Server time">
          <time dateTime={health.serverTime.toISOString()}>{health.serverTime.toISOString()}</time>
        </Row>
      </dl>
    </Panel>
  );
}

function MigrationsDetail({ migrations }: { migrations: Probe<MigrationState> }) {
  if (!migrations.ok) {
    return (
      <p className="font-mono text-[12px] text-redline">
        {migrations.error}
        {migrations.error.includes("42P01") ? ": no schema_migrations table; run npm run db:migrate." : null}
      </p>
    );
  }
  const { expected, applied, pending } = migrations.value;
  return (
    <>
      <p className="text-[13px] text-ink-dim">
        {expected === null
          ? `${plural(applied.length, "migration")} recorded. The migration files are not readable from this deployment, so whether it is behind is unknown.`
          : pending.length === 0
            ? `Up to date: all ${plural(expected.length, "file")} in lib/db/migrations are applied.`
            : `The database is behind: ${plural(pending.length, "file")} not applied. Run npm run db:migrate against this database.`}
      </p>
      {pending.length > 0 ? (
        <ul className="mt-3 font-mono text-[12px] text-redline">
          {pending.map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function NotificationsPanel({ notifications }: { notifications: Probe<NotificationState> }) {
  if (!notifications.ok) {
    return (
      <Panel id="notifications" title="Notifications">
        <p className="font-mono text-[12px] text-redline">{notifications.error}</p>
      </Panel>
    );
  }
  const { resendConfigured, lastNotifiedAt, unnotified, retryable } = notifications.value;
  const disabledReason = !resendConfigured
    ? "Set RESEND_API_KEY to send notifications; until then retrying would send nothing."
    : retryable === 0
      ? "Nothing to retry."
      : null;

  return (
    <Panel id="notifications" title="Notifications">
      <dl className="divide-y divide-line">
        <Row label="Resend">
          {resendConfigured ? "configured" : <span className="text-redline">not configured</span>}
        </Row>
        <Row label="Last sent">
          {lastNotifiedAt ? (
            <time dateTime={lastNotifiedAt.toISOString()}>{formatAbsoluteTime(lastNotifiedAt)}</time>
          ) : (
            <span className="text-ink-faint">never</span>
          )}
        </Row>
        <Row label="Unnotified">
          {formatCount(unnotified)} total, {formatCount(retryable)} not archived
        </Row>
      </dl>
      <form method="post" action="/api/admin/notifications/retry" className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <button type="submit" disabled={disabledReason !== null} className={`${buttonStyles.accent} disabled:cursor-not-allowed disabled:border-line-bright disabled:bg-transparent disabled:text-ink-faint disabled:hover:border-line-bright disabled:hover:bg-transparent`}>
          Retry notifications
        </button>
        <p className="font-mono text-[11px] text-ink-faint">
          {disabledReason ?? `Sends up to ${RETRY_LIMIT}, oldest first, paced for Resend's rate limit.`}
        </p>
      </form>
    </Panel>
  );
}

export default async function HealthPage({ searchParams }: { searchParams: SearchParams }) {
  if (!(await hasAdminSession())) return null;

  const [health, params] = await Promise.all([getHealth(), searchParams]);
  const retried = parseRetried(params.retried);
  const resendConfigured = health.notifications.ok && health.notifications.value.resendConfigured;
  const missingRequired = health.env.filter((c) => c.required && c.state !== "set").length;

  return (
    <>
      <PageHeader
        title="Health"
        meta={
          <>
            <span>{formatAbsoluteTime(health.serverTime)}</span>
            <span>{health.node}</span>
          </>
        }
      />
      {retried ? <RetryBanner outcome={retried} resendConfigured={resendConfigured} /> : null}
      <div className="grid gap-4 sm:gap-6">
        <StatGrid>
          {latencyCell(health.db)}
          {migrationCell(health.migrations)}
          {notificationCell(health.notifications)}
          {deployCell(health.deploy)}
        </StatGrid>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <Panel
            id="env"
            title="Environment"
            aside={missingRequired > 0 ? <span className="text-redline">{missingRequired} required missing</span> : "names only, never values"}
          >
            <ul className="divide-y divide-line">
              {health.env.map((check) => (
                <EnvRow key={check.name} check={check} />
              ))}
            </ul>
          </Panel>
          <div className="grid content-start gap-4 sm:gap-6">
            <NotificationsPanel notifications={health.notifications} />
            <Panel id="migrations" title="Migrations">
              <MigrationsDetail migrations={health.migrations} />
            </Panel>
            <DeployPanel health={health} />
          </div>
        </div>
      </div>
    </>
  );
}
