import "server-only";
import { getDb } from "@/lib/db/client";

export const messageStatuses = ["new", "read", "replied"] as const;
export type MessageStatus = (typeof messageStatuses)[number];

export type Message = {
  id: string;
  createdAt: Date;
  name: string;
  email: string;
  message: string;
  status: MessageStatus;
  notifiedAt: Date | null;
};

export type NewMessage = {
  name: string;
  email: string;
  message: string;
  ipHash: string;
  userAgent: string | null;
};

export function isMessageStatus(value: unknown): value is MessageStatus {
  return typeof value === "string" && (messageStatuses as readonly string[]).includes(value);
}

export async function insertMessage(input: NewMessage) {
  const [row] = await getDb()<{ id: string }[]>`
    insert into messages (name, email, message, ip_hash, user_agent)
    values (${input.name}, ${input.email}, ${input.message}, ${input.ipHash}, ${input.userAgent})
    returning id
  `;
  if (!row) throw new Error("Insert returned no row.");
  return row.id;
}

export async function countRecentByIp(ipHash: string, windowSeconds: number) {
  const [row] = await getDb()<{ count: number }[]>`
    select count(*)::int as count from messages
    where ip_hash = ${ipHash}
      and created_at > now() - make_interval(secs => ${windowSeconds})
  `;
  return row?.count ?? 0;
}

// Matched case-insensitively so "A@x.com" and "a@x.com" share one window.
export async function countRecentByEmail(email: string, windowSeconds: number) {
  const [row] = await getDb()<{ count: number }[]>`
    select count(*)::int as count from messages
    where lower(email) = lower(${email})
      and created_at > now() - make_interval(secs => ${windowSeconds})
  `;
  return row?.count ?? 0;
}

export async function markNotified(id: string) {
  await getDb()`update messages set notified_at = now() where id = ${id}`;
}

export async function listMessages(limit = 200) {
  return getDb()<Message[]>`
    select id, created_at as "createdAt", name, email, message, status, notified_at as "notifiedAt"
    from messages
    order by created_at desc
    limit ${limit}
  `;
}

// Returns false when no row has that id, so the route can answer 404.
export async function setMessageStatus(id: string, status: MessageStatus) {
  const rows = await getDb()`update messages set status = ${status} where id = ${id} returning id`;
  return rows.length > 0;
}
