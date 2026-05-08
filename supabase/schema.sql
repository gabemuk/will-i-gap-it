-- Will I Gap It? — Supabase schema
-- Run this in the Supabase SQL editor to create tables and RLS policies.

-- ────────────────────────────────────────────────────────────────────
-- matchups
-- Stores saved car matchups with prediction results.
-- ────────────────────────────────────────────────────────────────────
create table if not exists matchups (
  id          uuid primary key default gen_random_uuid(),
  share_code  text unique not null,
  car_a       jsonb not null,
  car_b       jsonb not null,
  race_type   text not null,
  prediction  jsonb not null,
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────────
-- race_results
-- Stores actual outcomes submitted after the race.
-- ────────────────────────────────────────────────────────────────────
create table if not exists race_results (
  id                    uuid primary key default gen_random_uuid(),
  matchup_id            uuid references matchups(id) on delete cascade,
  actual_winner         text not null,
  actual_gap            text not null,
  result_notes          text,
  proof_type            text default 'none',
  prediction_was_correct boolean,
  created_at            timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────────────────────────
alter table matchups enable row level security;
alter table race_results enable row level security;

-- matchups: allow anyone to read and insert
create policy "Public can insert matchups"
  on matchups for insert
  with check (true);

create policy "Public can select matchups"
  on matchups for select
  using (true);

-- race_results: allow anyone to read and insert
create policy "Public can insert race_results"
  on race_results for insert
  with check (true);

create policy "Public can select race_results"
  on race_results for select
  using (true);
