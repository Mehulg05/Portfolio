/*
  Shared by the db-* scripts. The portfolio may live in its own database (the normal case)
  or, as a fallback, in a `portfolio` schema inside a database it shares with another app.
  DATABASE_SCHEMA names that schema; it defaults to public.

  Every script runs its statements inside a transaction that starts with
  `set local search_path`, which works through Neon's transaction pooler as well as on a
  direct connection: a session-level SET or a startup parameter would not survive the pooler.
*/
import postgres from "postgres";

const identifier = /^[a-z_][a-z0-9_]{0,62}$/;

export function databaseSchema() {
  const schema = process.env.DATABASE_SCHEMA || "public";
  if (!identifier.test(schema)) {
    console.error(`DATABASE_SCHEMA must be a lowercase identifier, got "${schema}".`);
    process.exit(1);
  }
  return schema;
}

export function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  return postgres(url, { max: 1, prepare: false, onnotice: () => {} });
}

/** Runs `fn` in a transaction whose unqualified table names resolve to DATABASE_SCHEMA. */
export function inSchema(sql, fn) {
  const schema = databaseSchema();
  return sql.begin(async (tx) => {
    // Validated above, so interpolating the quoted identifier is safe.
    await tx.unsafe(`set local search_path to "${schema}"`);
    return fn(tx);
  });
}
