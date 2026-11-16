/*
  Applies lib/db/migrations/*.sql in filename order, each in its own transaction, and
  records it in portfolio_schema_migrations so a second run is a no-op. Forward-only by
  design: a mistake is fixed by the next numbered file, never by editing an applied one.

  Safe on a database it does not own exclusively (the Neon project is shared with another
  app): it only creates and alters the tables its own migrations declare, the tracking
  table carries a portfolio_ prefix so it cannot collide with another tool's, and nothing
  outside DATABASE_SCHEMA (default public) is touched.

    DATABASE_URL=... [DATABASE_SCHEMA=portfolio] npm run db:migrate
*/
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { connect, databaseSchema, inSchema } from "./db-connect.mjs";

const dir = path.join(process.cwd(), "lib/db/migrations");
const sql = connect();

try {
  const applied = await inSchema(sql, async (tx) => {
    await tx`
      create table if not exists portfolio_schema_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )
    `;
    return new Set((await tx`select name from portfolio_schema_migrations`).map((row) => row.name));
  });

  const files = (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort();
  const pending = files.filter((file) => !applied.has(file));

  for (const file of pending) {
    const body = await readFile(path.join(dir, file), "utf8");
    await inSchema(sql, async (tx) => {
      await tx.unsafe(body);
      await tx`insert into portfolio_schema_migrations (name) values (${file})`;
    });
    console.log(`applied  ${file}`);
  }

  const where = `schema "${databaseSchema()}"`;
  console.log(pending.length ? `${pending.length} migration(s) applied in ${where}.` : `Up to date in ${where}.`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
