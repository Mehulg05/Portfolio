import "server-only";
import postgres from "postgres";

/*
  The one connection helper. Lazy, so a build or a request without DATABASE_URL never
  tries to connect, and a module-level singleton, so a warm serverless instance reuses
  its connection instead of opening one per request.

  Settings are for Neon's pooled endpoint (PgBouncer in transaction mode): one connection
  per instance, short idle timeout so frozen lambdas do not hold slots, and no prepared
  statements, which transaction pooling cannot carry between queries.
*/
let client: postgres.Sql | null = null;

const identifier = /^[a-z_][a-z0-9_]{0,62}$/;

/*
  The portfolio normally has a database of its own (public schema). The fallback is a
  dedicated schema inside a database shared with another app, named by DATABASE_SCHEMA.
  It is sent as a startup parameter on direct connections; Neon's pooler does not carry
  startup parameters, so there the role's own default (ALTER ROLE ... SET search_path,
  see docs/contact-backend.md) does the same job.
*/
function searchPathOption(url: string) {
  const schema = process.env.DATABASE_SCHEMA || "public";
  if (!identifier.test(schema)) throw new Error("DATABASE_SCHEMA must be a lowercase identifier.");
  if (schema === "public" || new URL(url).hostname.includes("-pooler.")) return {};
  return { connection: { search_path: schema } };
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  client ??= postgres(url, {
    max: 1,
    idle_timeout: 20,
    // Fail fast: each sequential query would otherwise pay the full wait during an outage.
    connect_timeout: 5,
    prepare: false,
    onnotice: () => {},
    ...searchPathOption(url),
  });
  return client;
}
