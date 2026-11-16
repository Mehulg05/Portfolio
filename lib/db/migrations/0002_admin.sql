-- Admin panel: triage timestamps and an archived state on messages, sign-in throttling,
-- and the self-hosted page analytics behind /pulse.

-- `status` stays the cheap filter; the timestamps answer "how long until I read/replied".
alter table messages add column read_at timestamptz;
alter table messages add column replied_at timestamptz;
alter table messages add column archived_at timestamptz;
alter table messages drop constraint messages_status_check;
alter table messages add constraint messages_status_check
  check (status in ('new', 'read', 'replied', 'archived'));

-- One row per sign-in attempt; the limit is a count per ip_hash over a window.
create table login_attempts (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  ip_hash text not null,
  succeeded boolean not null
);
create index login_attempts_ip_hash_created_at_idx on login_attempts (ip_hash, created_at);

-- One row per page load. The view beacon inserts it; the leave beacon fills in the
-- engagement columns on the same row via its client-generated id.
-- visitor_hash is an HMAC keyed with a salt that includes the day, so a visitor cannot be
-- followed from one day to the next. No cookies, no raw IPs.
create table page_views (
  id uuid primary key,
  created_at timestamptz not null default now(),
  day date not null default current_date,
  visitor_hash text not null,
  path text not null,
  referrer_host text,
  screen text not null check (screen in ('phone', 'desktop')),
  country text,
  seconds integer,
  max_scroll_pct smallint,
  sections text[],
  resume_clicked boolean not null default false,
  mailto_clicked boolean not null default false
);
create index page_views_day_idx on page_views (day);
create index page_views_visitor_hash_created_at_idx on page_views (visitor_hash, created_at);
create index page_views_created_at_idx on page_views (created_at);
