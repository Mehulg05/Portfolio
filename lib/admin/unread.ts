import "server-only";
import { cache } from "react";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";

/*
  The admin layout needs the unread count twice per request (the document title and the
  nav badge); cache() makes that one query. Callers check the session first: a signed-out
  request must not learn the count, even through the title.

  Errors resolve to null so a database hiccup costs the badge, not the whole panel.
*/
export const countUnreadMessages = cache(async (): Promise<number | null> => {
  if (!isDatabaseConfigured()) return null;
  try {
    const rows = await getDb()<{ count: number }[]>`
      select count(*)::int as count from messages where status = 'new'
    `;
    return rows[0]?.count ?? 0;
  } catch (error) {
    console.error("[admin] counting unread messages failed", error);
    return null;
  }
});
