-- Lemma IMS — database schema
-- Tenant model: every row is scoped to a company_id.
-- RLS: a user can only see rows whose company_id matches their own.
--
-- This file is idempotent — safe to re-run.
--
-- Order matters:
--   1. Extensions
--   2. All tables (so functions and policies can reference them)
--   3. Helper functions used by RLS
--   4. RLS enable + policies
--   5. Triggers (including the auth signup trigger)


-- =====================================================================
-- 1. Extensions
-- =====================================================================

create extension if not exists "pgcrypto";


-- =====================================================================
-- 2. Tables (in dependency order)
-- =====================================================================

-- companies ------------------------------------------------------------
create table if not exists public.companies (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  industry              text,
  country               text,
  certification_goal    text,
  document_language     text default 'en',
  interface_language    text default 'en',
  setup_step            integer not null default 0,
  target_date           date,
  employee_count        integer,
  director_name         text,
  director_email        text,
  qms_manager_name      text,
  qms_manager_email     text,
  department_heads      jsonb not null default '[]'::jsonb,
  sites                 jsonb not null default '[]'::jsonb,
  consultant_name       text,
  processes             jsonb not null default '[]'::jsonb,
  quality_objectives    jsonb not null default '[]'::jsonb,
  document_code_prefix  text default 'DOC',
  created_at            timestamptz not null default now()
);


-- users ----------------------------------------------------------------
-- id mirrors auth.users(id). The on_auth_user_created trigger (below)
-- inserts a matching row here on signup.
create table if not exists public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  company_id          uuid references public.companies(id) on delete set null,
  email               text not null unique,
  full_name           text,
  role                text not null default 'member'
                      check (role in ('owner', 'admin', 'member', 'auditor')),
  department          text,
  notification_prefs  jsonb not null default '{"email_reminders": true}'::jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists users_company_id_idx on public.users(company_id);


-- documents ------------------------------------------------------------
create table if not exists public.documents (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  title          text not null,
  document_type  text not null,
  status         text not null default 'draft'
                 check (status in ('draft', 'in_review', 'approved', 'obsolete')),
  content        text,
  document_code  text,
  version        text not null default '1.0',
  language       text default 'en',
  owner_id       uuid references public.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists documents_company_id_idx on public.documents(company_id);
create index if not exists documents_owner_id_idx   on public.documents(owner_id);


-- gap_answers ----------------------------------------------------------
create table if not exists public.gap_answers (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  clause_id           text not null,
  answer              text,
  status              text not null default 'pending'
                      check (status in ('pending', 'compliant', 'gap', 'not_applicable', 'user_confirmed')),
  evidence_confirmed  boolean not null default false,
  created_at          timestamptz not null default now(),
  unique (company_id, clause_id)
);

create index if not exists gap_answers_company_id_idx on public.gap_answers(company_id);


-- evidence -------------------------------------------------------------
create table if not exists public.evidence (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  clause_ids      text[] not null default '{}',
  evidence_type   text not null,
  file_name       text,
  expiry_date     date,
  status          text not null default 'active'
                  check (status in ('active', 'expiring', 'expired', 'archived')),
  user_confirmed  boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists evidence_company_id_idx on public.evidence(company_id);
create index if not exists evidence_clause_ids_idx on public.evidence using gin (clause_ids);


-- capas ----------------------------------------------------------------
create table if not exists public.capas (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references public.companies(id) on delete cascade,
  description          text not null,
  severity             text not null default 'medium'
                       check (severity in ('low', 'medium', 'high', 'critical')),
  status               text not null default 'open'
                       check (status in ('open', 'in_progress', 'verified', 'closed')),
  responsible_id       uuid references public.users(id) on delete set null,
  due_date             date,
  root_cause           text,
  corrective_action    text,
  immediate_fix        text,
  five_whys            jsonb not null default '[]'::jsonb,
  evidence_ids         jsonb not null default '[]'::jsonb,
  effectiveness_check  text,
  closed_at            timestamptz,
  current_step         integer not null default 1
                       check (current_step between 1 and 7),
  created_at           timestamptz not null default now()
);

create index if not exists capas_company_id_idx     on public.capas(company_id);
create index if not exists capas_responsible_id_idx on public.capas(responsible_id);


-- suppliers ------------------------------------------------------------
create table if not exists public.suppliers (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  name              text not null,
  product           text,
  criticality       text not null default 'medium'
                    check (criticality in ('low', 'medium', 'high', 'critical')),
  cert_expiry       date,
  approval_status   text not null default 'pending'
                    check (approval_status in ('pending', 'approved', 'rejected', 'suspended')),
  evaluation_score  numeric(5,2),
  certificate_path  text,
  created_at        timestamptz not null default now()
);

create index if not exists suppliers_company_id_idx on public.suppliers(company_id);


-- activity_log ---------------------------------------------------------
create table if not exists public.activity_log (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  user_id      uuid references public.users(id) on delete set null,
  event_type   text not null,
  description  text,
  created_at   timestamptz not null default now()
);

create index if not exists activity_log_company_id_idx on public.activity_log(company_id);
create index if not exists activity_log_created_at_idx on public.activity_log(created_at desc);


-- risks ----------------------------------------------------------------
create table if not exists public.risks (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  kind              text not null default 'risk' check (kind in ('risk', 'opportunity')),
  description       text not null,
  process           text,
  clause_id         text,
  likelihood        integer not null check (likelihood between 1 and 5),
  impact            integer not null check (impact between 1 and 5),
  treatment         text check (treatment in ('Avoid', 'Reduce', 'Transfer', 'Accept')),
  responsible_id    uuid references public.users(id) on delete set null,
  responsible_name  text,
  review_date       date,
  status            text not null default 'open' check (status in ('open', 'mitigated', 'closed')),
  created_at        timestamptz not null default now()
);

create index if not exists risks_company_id_idx on public.risks(company_id);


-- audits ---------------------------------------------------------------
create table if not exists public.audits (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  title           text,
  department      text not null,
  auditor_id      uuid references public.users(id) on delete set null,
  auditor_name    text,
  scheduled_date  date,
  status          text not null default 'planned'
                  check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
  report          text,
  created_at      timestamptz not null default now()
);

create index if not exists audits_company_id_idx     on public.audits(company_id);
create index if not exists audits_scheduled_date_idx on public.audits(scheduled_date);


-- audit_findings -------------------------------------------------------
create table if not exists public.audit_findings (
  id            uuid primary key default gen_random_uuid(),
  audit_id      uuid not null references public.audits(id) on delete cascade,
  company_id    uuid not null references public.companies(id) on delete cascade,
  clause_id     text,
  description   text,
  finding_type  text not null check (finding_type in ('conformant', 'nc', 'observation')),
  capa_id       uuid references public.capas(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (audit_id, clause_id)
);

create index if not exists audit_findings_audit_id_idx   on public.audit_findings(audit_id);
create index if not exists audit_findings_company_id_idx on public.audit_findings(company_id);


-- trainings ------------------------------------------------------------
create table if not exists public.trainings (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  kind            text not null default 'record' check (kind in ('record', 'plan')),
  employee_id     uuid references public.users(id) on delete set null,
  employee_name   text,
  module          text not null,
  training_date   date,
  scheduled_month text,
  result          text check (result in ('pass', 'fail', 'pending')),
  evidence_url    text,
  trainer         text,
  status          text not null default 'pending',
  created_at      timestamptz not null default now()
);

create index if not exists trainings_company_id_idx on public.trainings(company_id);


-- management_reviews ---------------------------------------------------
create table if not exists public.management_reviews (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  review_date     date,
  manual_inputs   jsonb not null default '{}'::jsonb,
  agenda          text,
  decisions       text,
  action_items    jsonb not null default '[]'::jsonb,
  resource_needs  text,
  minutes         text,
  status          text not null default 'draft' check (status in ('draft', 'completed')),
  created_at      timestamptz not null default now()
);

create index if not exists management_reviews_company_id_idx on public.management_reviews(company_id);


-- consultant_reviews ---------------------------------------------------
create table if not exists public.consultant_reviews (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  document_id       uuid references public.documents(id) on delete set null,
  consultant_name   text not null,
  consultant_email  text,
  message           text,
  status            text not null default 'pending'
                    check (status in ('pending', 'reviewed', 'approved', 'returned')),
  comments          jsonb not null default '[]'::jsonb,
  requested_at      timestamptz not null default now(),
  reviewed_at       timestamptz
);

create index if not exists consultant_reviews_company_id_idx on public.consultant_reviews(company_id);


-- reports --------------------------------------------------------------
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  type          text not null,
  filename      text,
  generated_by  uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists reports_company_id_idx on public.reports(company_id);


-- =====================================================================
-- 3. Helper functions used by RLS
-- =====================================================================

-- Resolves the current user's company_id from public.users.
-- SECURITY DEFINER so it can read users without recursing into RLS.
-- Defined AFTER public.users because Postgres validates SQL function
-- bodies at creation time.
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.users where id = auth.uid()
$$;


-- =====================================================================
-- 4. Row Level Security
-- =====================================================================

alter table public.companies          enable row level security;
alter table public.users              enable row level security;
alter table public.documents          enable row level security;
alter table public.gap_answers        enable row level security;
alter table public.evidence           enable row level security;
alter table public.capas              enable row level security;
alter table public.suppliers          enable row level security;
alter table public.activity_log       enable row level security;
alter table public.risks              enable row level security;
alter table public.audits             enable row level security;
alter table public.audit_findings     enable row level security;
alter table public.trainings          enable row level security;
alter table public.management_reviews enable row level security;
alter table public.consultant_reviews enable row level security;
alter table public.reports            enable row level security;

-- Drop-then-create makes policies idempotent. Postgres doesn't accept
-- `create policy if not exists`, so we drop first.

-- companies
drop policy if exists "companies_select_own"           on public.companies;
drop policy if exists "companies_update_own"           on public.companies;
drop policy if exists "companies_insert_authenticated" on public.companies;

create policy "companies_select_own"
  on public.companies for select
  using (id = public.current_company_id());

create policy "companies_update_own"
  on public.companies for update
  using (id = public.current_company_id())
  with check (id = public.current_company_id());

-- Inserts of a new company happen during signup; allow any authenticated
-- user to create one (they then get linked via users.company_id).
create policy "companies_insert_authenticated"
  on public.companies for insert
  to authenticated
  with check (true);

-- users
drop policy if exists "users_select_self_or_same_company" on public.users;
drop policy if exists "users_insert_self"                 on public.users;
drop policy if exists "users_update_self_or_admin"        on public.users;

create policy "users_select_self_or_same_company"
  on public.users for select
  using (
    id = auth.uid()
    or company_id = public.current_company_id()
  );

create policy "users_insert_self"
  on public.users for insert
  to authenticated
  with check (id = auth.uid());

create policy "users_update_self_or_admin"
  on public.users for update
  using (
    id = auth.uid()
    or (
      company_id = public.current_company_id()
      and exists (
        select 1 from public.users me
        where me.id = auth.uid()
          and me.role in ('owner', 'admin')
      )
    )
  );

-- documents
drop policy if exists "documents_company_access" on public.documents;
create policy "documents_company_access"
  on public.documents for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- gap_answers
drop policy if exists "gap_answers_company_access" on public.gap_answers;
create policy "gap_answers_company_access"
  on public.gap_answers for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- evidence
drop policy if exists "evidence_company_access" on public.evidence;
create policy "evidence_company_access"
  on public.evidence for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- capas
drop policy if exists "capas_company_access" on public.capas;
create policy "capas_company_access"
  on public.capas for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- suppliers
drop policy if exists "suppliers_company_access" on public.suppliers;
create policy "suppliers_company_access"
  on public.suppliers for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- activity_log
drop policy if exists "activity_log_select_company" on public.activity_log;
drop policy if exists "activity_log_insert_company" on public.activity_log;

create policy "activity_log_select_company"
  on public.activity_log for select
  using (company_id = public.current_company_id());

create policy "activity_log_insert_company"
  on public.activity_log for insert
  with check (company_id = public.current_company_id());

-- risks
drop policy if exists "risks_company_access" on public.risks;
create policy "risks_company_access"
  on public.risks for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- audits
drop policy if exists "audits_company_access" on public.audits;
create policy "audits_company_access"
  on public.audits for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- audit_findings
drop policy if exists "audit_findings_company_access" on public.audit_findings;
create policy "audit_findings_company_access"
  on public.audit_findings for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- trainings
drop policy if exists "trainings_company_access" on public.trainings;
create policy "trainings_company_access"
  on public.trainings for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- management_reviews
drop policy if exists "management_reviews_company_access" on public.management_reviews;
create policy "management_reviews_company_access"
  on public.management_reviews for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- consultant_reviews
drop policy if exists "consultant_reviews_company_access" on public.consultant_reviews;
create policy "consultant_reviews_company_access"
  on public.consultant_reviews for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- reports
drop policy if exists "reports_company_access" on public.reports;
create policy "reports_company_access"
  on public.reports for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());


-- =====================================================================
-- 5. Triggers
-- =====================================================================

-- Keep documents.updated_at fresh on update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();


-- When a user signs up via Supabase Auth, mirror them into public.users.
-- company_id stays NULL until onboarding links/creates a company.
-- full_name is pulled from raw_user_meta_data set during signUp().
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
