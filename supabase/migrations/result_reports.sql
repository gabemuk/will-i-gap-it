-- Migration: result_reports
-- Creates a table for users to flag/report submitted race results.
-- Run this manually in the Supabase SQL editor.

create table if not exists public.result_reports (
  id                  uuid primary key default gen_random_uuid(),
  race_result_id      uuid not null references public.race_results(id) on delete cascade,
  reason              text not null,
  note                text,
  reporter_user_id    uuid references auth.users(id) on delete set null,
  reporter_fingerprint text,
  created_at          timestamptz default now(),

  -- Valid reason values
  constraint result_reports_reason_check check (
    reason in (
      'fake_result',
      'wrong_cars',
      'wrong_winner',
      'bad_proof_link',
      'private_info_shown',
      'spam_or_joke',
      'unsafe_content',
      'duplicate',
      'other'
    )
  ),

  -- Note length guard
  constraint result_reports_note_length_check check (
    note is null or char_length(note) <= 500
  )
);

-- Indexes
create index if not exists result_reports_race_result_id_idx
  on public.result_reports (race_result_id);

create index if not exists result_reports_created_at_idx
  on public.result_reports (created_at desc);

-- Enable Row Level Security
alter table public.result_reports enable row level security;

-- Policy: anyone (anon or authenticated) can insert a report
-- reporter_user_id must match auth.uid() when logged in, or be null for anon users.
create policy "Anyone can insert a result report"
  on public.result_reports
  for insert
  to anon, authenticated
  with check (
    reporter_user_id is null
    or reporter_user_id = auth.uid()
  );

-- No public select policy — reports are private / admin-only.
-- Future admin tooling can use service-role key to read reports.

-- Note: dispute_count column on race_results was already added in
-- the learning_foundation migration. No changes needed here.
