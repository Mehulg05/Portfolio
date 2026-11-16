import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { MIN_SECRET_LENGTH } from "@/lib/admin/auth";
import { isResendConfigured } from "@/lib/admin/maintenance";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";

/*
  Everything /health shows, gathered per request. Each probe fails on its own: a missing
  portfolio_schema_migrations table should not hide the DB latency, and a dead database should still
  leave the env checklist and deploy info readable, since those are what explain it.

  Errors are reported by class and code only (PostgresError 42P01, Error ECONNREFUSED).
  A driver message can carry a hostname or a fragment of the connection string.
*/

export type Probe<T> = { ok: true; value: T } | { ok: false; error: string };

export type DbLatency = {
  /** The first query of the request; includes the TCP/TLS handshake when the instance was cold. */
  firstMs: number;
  /** A second query on the now-open connection: the plain round trip. */
  warmMs: number;
};

export type MigrationState = {
  /** Filenames in lib/db/migrations, or null when the directory is not readable here. */
  expected: string[] | null;
  applied: string[];
  latest: string | null;
  /** Expected files the database has not recorded; empty when up to date or unknown. */
  pending: string[];
};

export type NotificationState = {
  resendConfigured: boolean;
  lastNotifiedAt: Date | null;
  /** Every message without notified_at. */
  unnotified: number;
  /** The subset the retry would pick up (not archived). */
  retryable: number;
};

export type EnvState = "set" | "missing" | "short";
export type EnvCheck = { name: string; state: EnvState; required: boolean; purpose: string };

export type DeployInfo = {
  env: string;
  region: string | null;
  sha: string | null;
  commitUrl: string | null;
  message: string | null;
};

export type Health = {
  db: Probe<DbLatency>;
  migrations: Probe<MigrationState>;
  notifications: Probe<NotificationState>;
  env: EnvCheck[];
  deploy: DeployInfo;
  node: string;
  serverTime: Date;
};

const REPO_COMMIT_URL = "https://github.com/Mehulg05/Portfolio/commit/";
const SHA_PATTERN = /^[0-9a-f]{7,40}$/i;
const CODE_PATTERN = /^[A-Z0-9_]{2,24}$/i;

const envSpec: Omit<EnvCheck, "state">[] = [
  { name: "DATABASE_URL", required: true, purpose: "messages, pulse, this page" },
  { name: "IP_HASH_SALT", required: true, purpose: "contact rate limits, visitor hashes" },
  { name: "INBOX_SECRET", required: true, purpose: `admin sign-in, at least ${MIN_SECRET_LENGTH} chars` },
  { name: "RESEND_API_KEY", required: false, purpose: "email on new messages" },
  { name: "CONTACT_TO_EMAIL", required: false, purpose: "recipient, falls back to the profile email" },
  { name: "NEXT_PUBLIC_SITE_URL", required: true, purpose: "absolute links, admin URL protocol and port" },
  { name: "ADMIN_HOST", required: false, purpose: "defaults to admin.mehulgupta.me" },
  { name: "CRON_SECRET", required: true, purpose: "authorises the daily /api/cron run" },
];

export function errorClass(error: unknown) {
  if (!(error instanceof Error)) return typeof error;
  const code = "code" in error ? error.code : undefined;
  return typeof code === "string" && CODE_PATTERN.test(code) ? `${error.name} ${code}` : error.name;
}

async function probe<T>(run: () => Promise<T>): Promise<Probe<T>> {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    return { ok: false, error: errorClass(error) };
  }
}

function roundMs(ms: number) {
  return Math.round(ms * 10) / 10;
}

async function timeSelectOne() {
  const started = performance.now();
  await getDb()`select 1`;
  return roundMs(performance.now() - started);
}

async function measureLatency(): Promise<DbLatency> {
  const firstMs = await timeSelectOne();
  const warmMs = await timeSelectOne();
  return { firstMs, warmMs };
}

/*
  Read at request time rather than bundled, so the page reports the files this deployment
  actually shipped. Null when the directory is not in the function bundle: the page then
  says "unknown" instead of claiming the database is up to date.
*/
async function migrationFiles() {
  try {
    const files = await readdir(path.join(process.cwd(), "lib", "db", "migrations"));
    return files.filter((file) => file.endsWith(".sql")).sort();
  } catch {
    return null;
  }
}

async function migrationState(): Promise<MigrationState> {
  const [expected, rows] = await Promise.all([
    migrationFiles(),
    getDb()<{ name: string }[]>`select name from portfolio_schema_migrations order by name desc`,
  ]);
  const applied = rows.map((row) => row.name);
  const appliedSet = new Set(applied);
  return {
    expected,
    applied,
    latest: applied[0] ?? null,
    pending: expected ? expected.filter((file) => !appliedSet.has(file)) : [],
  };
}

async function notificationState(): Promise<NotificationState> {
  const [row] = await getDb()<{ lastNotifiedAt: Date | null; unnotified: number; retryable: number }[]>`
    select
      max(notified_at) as "lastNotifiedAt",
      count(*) filter (where notified_at is null)::int as unnotified,
      count(*) filter (where notified_at is null and status <> 'archived')::int as retryable
    from messages
  `;
  return {
    resendConfigured: isResendConfigured(),
    lastNotifiedAt: row?.lastNotifiedAt ?? null,
    unnotified: row?.unnotified ?? 0,
    retryable: row?.retryable ?? 0,
  };
}

/** Presence only. Values are never read past this function and never leave it. */
function envChecks(): EnvCheck[] {
  return envSpec.map((spec) => {
    const value = process.env[spec.name]?.trim() ?? "";
    let state: EnvState = value ? "set" : "missing";
    if (spec.name === "INBOX_SECRET" && value && value.length < MIN_SECRET_LENGTH) state = "short";
    return { ...spec, state };
  });
}

function deployInfo(): DeployInfo {
  const rawSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() ?? "";
  const sha = SHA_PATTERN.test(rawSha) ? rawSha.toLowerCase() : null;
  const message = process.env.VERCEL_GIT_COMMIT_MESSAGE?.split(/\r?\n/)[0]?.trim().slice(0, 140) || null;
  return {
    env: process.env.VERCEL_ENV?.trim() || "local",
    region: process.env.VERCEL_REGION?.trim() || null,
    sha,
    commitUrl: sha ? `${REPO_COMMIT_URL}${sha}` : null,
    message,
  };
}

const notConfigured = { ok: false, error: "DATABASE_URL is not set" } as const;

export async function getHealth(): Promise<Health> {
  const dbConfigured = isDatabaseConfigured();
  // Latency first and alone, so the parallel queries below do not queue behind it on the one connection.
  const db = dbConfigured ? await probe(measureLatency) : notConfigured;
  const [migrations, notifications] = dbConfigured
    ? await Promise.all([probe(migrationState), probe(notificationState)])
    : [notConfigured, notConfigured];

  return {
    db,
    migrations,
    notifications,
    env: envChecks(),
    deploy: deployInfo(),
    node: process.version,
    serverTime: new Date(),
  };
}
