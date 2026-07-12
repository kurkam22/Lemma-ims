-- Reminders & deadlines (Batch 3)
-- Paste this whole file into Supabase → SQL Editor → Run.

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  kind text not null default 'custom'
    check (kind in ('capa','audit','document_review','training','certificate','management_review','custom')),
  due_date date not null,
  notify_days_before int not null default 7 check (notify_days_before between 0 and 60),
  notes text,
  status text not null default 'open' check (status in ('open','done')),
  last_notified_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists reminders_company_due_idx
  on public.reminders (company_id, status, due_date);

alter table public.reminders enable row level security;

-- Members of a company can see and manage their own company's reminders.
drop policy if exists "reminders select own company" on public.reminders;
create policy "reminders select own company" on public.reminders
  for select using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.company_id = reminders.company_id
    )
  );

drop policy if exists "reminders insert own company" on public.reminders;
create policy "reminders insert own company" on public.reminders
  for insert with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.company_id = reminders.company_id
    )
  );

drop policy if exists "reminders update own company" on public.reminders;
create policy "reminders update own company" on public.reminders
  for update using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.company_id = reminders.company_id
    )
  );

drop policy if exists "reminders delete own company" on public.reminders;
create policy "reminders delete own company" on public.reminders
  for delete using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.company_id = reminders.company_id
    )
  );
