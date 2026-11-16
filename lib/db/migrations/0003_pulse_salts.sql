-- Pulse visitor hashes are keyed with a random salt per UTC day, generated on first use and
-- deleted once the day is over. Unlike a fixed secret plus the date, a deleted salt cannot
-- be recomputed by anyone, the site owner included, so visits on different days really
-- cannot be linked.
create table pulse_salts (
  day date primary key,
  salt text not null
);

-- A second, coarser key for rate limiting: the client network alone (IPv6 reduced to its
-- /64) under the same daily salt. Rotating the user agent no longer buys a fresh bucket.
alter table page_views add column source_hash text;
create index page_views_source_hash_created_at_idx on page_views (source_hash, created_at);
