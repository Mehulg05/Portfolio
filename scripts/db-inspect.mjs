/*
  Prints the most recent messages, for checking the contact pipeline from a terminal.

    DATABASE_URL=... npm run db:inspect [limit]
*/
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const limit = Number(process.argv[2] ?? 10);
const sql = postgres(url, { max: 1 });

try {
  const rows = await sql`
    select created_at, status, name, email, left(message, 60) as message, notified_at is not null as notified
    from messages
    order by created_at desc
    limit ${limit}
  `;
  const [{ count }] = await sql`select count(*)::int as count from messages`;
  console.table(rows);
  console.log(`${count} message(s) in total.`);
} finally {
  await sql.end();
}
