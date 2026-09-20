-- =====================================================================
-- Batch 14: "Report a problem"
-- Paste this whole file into Supabase -> SQL Editor -> Run.
-- It is safe to run twice.
-- =====================================================================

-- 1. Problem reports ---------------------------------------------------
create table if not exists public.issues (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  issue_no      integer not null,
  title         text not null,
  description   text not null,
  area          text not null default 'other'
                check (area in ('receiving', 'production', 'customer_service', 'supplier', 'other')),
  severity      text not null default 'medium'
                check (severity in ('low', 'medium', 'high', 'critical')),
  status        text not null default 'new'
                check (status in ('new', 'in_progress', 'resolved', 'closed')),
  reported_by   uuid references public.users(id) on delete set null,
  owner_id      uuid references public.users(id) on delete set null,
  due_date      date,
  action_taken  text,
  result_check  text,
  closed_at     timestamptz,
  capa_id       uuid references public.capas(id) on delete set null,
  supplier_id   uuid references public.suppliers(id) on delete set null,
  document_id   uuid references public.documents(id) on delete set null,
  photo_path    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (company_id, issue_no)
);

create index if not exists issues_company_id_idx on public.issues(company_id);
create index if not exists issues_owner_id_idx   on public.issues(owner_id);
create index if not exists issues_status_idx     on public.issues(company_id, status);

-- Each company counts its own problems: ISS-0001, ISS-0002, ...
create or replace function public.set_issue_no()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select coalesce(max(issue_no), 0) + 1
    into new.issue_no
    from public.issues
   where company_id = new.company_id;
  return new;
end;
$$;

drop trigger if exists issues_set_no on public.issues;
create trigger issues_set_no
  before insert on public.issues
  for each row execute function public.set_issue_no();

-- 2. Links between records and ISO requirements ------------------------
-- Rules suggest the links, a person confirms them. Stored per edition of
-- the standard, so the 2026 edition can be added without a rewrite.
create table if not exists public.requirement_links (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  source_type   text not null
                check (source_type in ('issue', 'capa', 'document', 'evidence', 'audit', 'supplier', 'training', 'risk')),
  source_id     uuid not null,
  standard      text not null default 'iso9001',
  edition       text not null default '2015',
  clause_id     text not null,
  origin        text not null default 'rule'
                check (origin in ('rule', 'ai_suggested', 'user')),
  confirmed     boolean not null default false,
  confirmed_by  uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (source_type, source_id, standard, edition, clause_id)
);

create index if not exists requirement_links_company_idx on public.requirement_links(company_id);
create index if not exists requirement_links_source_idx  on public.requirement_links(source_type, source_id);

-- 3. Access rules (row-level security) ---------------------------------
alter table public.issues            enable row level security;
alter table public.requirement_links enable row level security;

-- Everyone in a company can see its problems and report new ones.
drop policy if exists "issues_select_company" on public.issues;
create policy "issues_select_company"
  on public.issues for select
  using (company_id = public.current_company_id());

drop policy if exists "issues_insert_company" on public.issues;
create policy "issues_insert_company"
  on public.issues for insert
  with check (company_id = public.current_company_id() and reported_by = auth.uid());

-- Only the owner of a problem, or a company owner/admin, can change it.
drop policy if exists "issues_update_managers" on public.issues;
create policy "issues_update_managers"
  on public.issues for update
  using (
    company_id = public.current_company_id()
    and (
      owner_id = auth.uid()
      or exists (
        select 1 from public.users u
         where u.id = auth.uid() and u.role in ('owner', 'admin')
      )
    )
  )
  with check (company_id = public.current_company_id());

drop policy if exists "issues_delete_managers" on public.issues;
create policy "issues_delete_managers"
  on public.issues for delete
  using (
    company_id = public.current_company_id()
    and exists (
      select 1 from public.users u
       where u.id = auth.uid() and u.role in ('owner', 'admin')
    )
  );

drop policy if exists "requirement_links_company_access" on public.requirement_links;
create policy "requirement_links_company_access"
  on public.requirement_links for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- 4. Photo storage (private) -------------------------------------------
-- Files live in a folder named after the company id, so one company can
-- never open another company's photos.
insert into storage.buckets (id, name, public)
values ('issue-photos', 'issue-photos', false)
on conflict (id) do nothing;

drop policy if exists "issue_photos_read_own_company" on storage.objects;
create policy "issue_photos_read_own_company"
  on storage.objects for select
  using (
    bucket_id = 'issue-photos'
    and (storage.foldername(name))[1] = public.current_company_id()::text
  );

drop policy if exists "issue_photos_upload_own_company" on storage.objects;
create policy "issue_photos_upload_own_company"
  on storage.objects for insert
  with check (
    bucket_id = 'issue-photos'
    and (storage.foldername(name))[1] = public.current_company_id()::text
  );
