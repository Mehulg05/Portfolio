-- Emailed one-time sign-in codes for the admin panel. Only an HMAC of the code is stored,
-- never the code itself. A code is single use (used_at), short lived (expires_at) and dies
-- after a few wrong guesses (attempts), so six digits cannot be ground through.
create table admin_login_codes (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  code_hash text not null,
  attempts smallint not null default 0,
  used_at timestamptz
);
create index admin_login_codes_created_at_idx on admin_login_codes (created_at);
