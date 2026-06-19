-- ---------------------------------------------------------------------------
-- DOSM FnB — add an optional "next follow-up" date to call logs.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- It is idempotent: safe to run more than once.
--
-- Why: each call snapshot can now carry the date the caller should next
-- reach out. The app surfaces the LATEST follow-up date per allocation and
-- flags it amber (due today) / red (overdue) on the member "Up Next" queue
-- and the admin Progress Board.
--
-- Until this migration is applied the app still works — the follow-up
-- features simply stay dormant (no follow-up dates can be saved or shown).
-- ---------------------------------------------------------------------------

alter table public.call_logs
  add column if not exists next_follow_up date;

-- Helps the "due / overdue follow-up" lookups.
create index if not exists call_logs_next_follow_up_idx
  on public.call_logs (next_follow_up)
  where next_follow_up is not null;
