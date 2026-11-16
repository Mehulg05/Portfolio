/*
  Prints the most recent messages, for checking the contact pipeline from a terminal.

    DATABASE_URL=... npm run db:inspect [limit]
*/
import { connect, inSchema } from "./db-connect.mjs";

const limit = Number(process.argv[2] ?? 10);
const sql = connect();

try {
  const { rows, count } = await inSchema(sql, async (tx) => {
    const rows = await tx`
      select created_at, status, name, email, left(message, 60) as message, notified_at is not null as notified
      from messages
      order by created_at desc
      limit ${limit}
    `;
    const [{ count }] = await tx`select count(*)::int as count from messages`;
    return { rows, count };
  });
  console.table(rows);
  console.log(`${count} message(s) in total.`);
} finally {
  await sql.end();
}
