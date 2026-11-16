-- The contact form's store. One row per accepted submission; the row is the source of
-- truth and the email notification is a convenience (notified_at stays null if it fails).
create table messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  message text not null,
  -- HMAC of the client IP with a server salt: enough to rate limit, useless if leaked.
  ip_hash text not null,
  user_agent text,
  status text not null default 'new' check (status in ('new', 'read', 'replied')),
  notified_at timestamptz
);

-- Rate limiting counts recent rows per IP; the inbox lists newest first.
create index messages_ip_hash_created_at_idx on messages (ip_hash, created_at);
create index messages_created_at_idx on messages (created_at desc);
-- The per-email window is the other rate-limit query.
create index messages_email_created_at_idx on messages (lower(email), created_at);
