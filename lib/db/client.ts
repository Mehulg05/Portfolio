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

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  client ??= postgres(url, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    onnotice: () => {},
  });
  return client;
}
