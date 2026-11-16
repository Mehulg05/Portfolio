-- Sign-out that actually revokes. One row (id = 1) holds the moment before which no session
-- is valid; signing out sets it to now(). A session cookie carries its issue time, so a
-- cookie issued earlier stops working everywhere. Additive: until this table exists the
-- app falls back to signature-only checks and sign-out only clears the cookie.
create table admin_session_state (
  id smallint primary key default 1 check (id = 1),
  valid_after timestamptz not null default now()
);

-- The sign-in throttle also counts failures from all sources in one window.
create index login_attempts_created_at_idx on login_attempts (created_at);
