/*
  Applies lib/db/migrations/*.sql in filename order, each in its own transaction, and
  records it in schema_migrations so a second run is a no-op. Forward-only by design:
  a mistake is fixed by the next numbered file, never by editing an applied one.

    DATABASE_URL=... npm run db:migrate
*/
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const dir = path.join(process.cwd(), "lib/db/migrations");
const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  await sql`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `;

  const applied = new Set((await sql`select name from schema_migrations`).map((row) => row.name));
  const files = (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort();
  const pending = files.filter((file) => !applied.has(file));

  for (const file of pending) {
    const body = await readFile(path.join(dir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into schema_migrations (name) values (${file})`;
    });
    console.log(`applied  ${file}`);
  }

  console.log(pending.length ? `${pending.length} migration(s) applied.` : "Up to date.");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
