-- Document control: version history + audit trail (Batch 4)
-- Paste this whole file into Supabase → SQL Editor → Run.

-- 1) Version history: a snapshot of the content every time it changes.
create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  version_no int not null,
  content text not null,
  note text,
  created_by uuid,
  created_by_email text,
  created_at timestamptz not null default now(),
  unique (document_id, version_no)
);

create index if not exists document_versions_doc_idx
  on public.document_versions (document_id, version_no desc);

alter table public.document_versions enable row level security;

drop policy if exists "doc versions select own company" on public.document_versions;
create policy "doc versions select own company" on public.document_versions
  for select using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.company_id = document_versions.company_id)
  );

drop policy if exists "doc versions insert own company" on public.document_versions;
create policy "doc versions insert own company" on public.document_versions
  for insert with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.company_id = document_versions.company_id)
  );

-- 2) Audit trail: who did what, when. Insert-only (no update/delete policies)
--    so the log cannot be quietly rewritten.
create table if not exists public.document_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  action text not null check (action in (
    'created','edited','submitted_for_review','approved','sent_back_to_draft',
    'marked_obsolete','reopened_as_draft','version_restored'
  )),
  detail text,
  actor_id uuid,
  actor_email text,
  created_at timestamptz not null default now()
);

create index if not exists document_events_doc_idx
  on public.document_events (document_id, created_at desc);

alter table public.document_events enable row level security;

drop policy if exists "doc events select own company" on public.document_events;
create policy "doc events select own company" on public.document_events
  for select using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.company_id = document_events.company_id)
  );

drop policy if exists "doc events insert own company" on public.document_events;
create policy "doc events insert own company" on public.document_events
  for insert with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.company_id = document_events.company_id)
  );
