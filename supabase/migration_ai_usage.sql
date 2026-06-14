-- Migration: AI usage tracking for per-user daily rate limits.
-- Run this in the Supabase SQL editor. Idempotent — safe to re-run.

create table if not exists public.ai_usage (
  user_id  uuid not null references public.users(id) on delete cascade,
  action   text not null,
  day      date not null default current_date,
  count    integer not null default 0,
  primary key (user_id, action, day)
);

alter table public.ai_usage enable row level security;

drop policy if exists "ai_usage_own_rows" on public.ai_usage;
create policy "ai_usage_own_rows"
  on public.ai_usage for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
