-- =====================================================================
-- Batch 15: certificate dates and external audits (for the Certificate clock)
-- Paste this whole file into Supabase -> SQL Editor -> Run.
-- It is safe to run twice. It adds two new tables and changes nothing else.
-- =====================================================================

-- 1. The company's certificate (one per standard) ----------------------
create table if not exists public.certificates (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  standard        text not null default 'iso9001',
  body            text,                 -- certification body, as the company writes it
  certificate_no  text,
  issued_on       date not null,
  expires_on      date not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (expires_on > issued_on),
  unique (company_id, standard)
);

-- 2. Audits by the certification body ----------------------------------
create table if not exists public.external_audits (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  kind          text not null
                check (kind in ('initial', 'surveillance', 'recertification')),
  planned_date  date not null,
  status        text not null default 'planned'
                check (status in ('planned', 'done', 'cancelled')),
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists certificates_company_idx     on public.certificates(company_id);
create index if not exists external_audits_company_idx  on public.external_audits(company_id);

-- 3. Access rules (row-level security) ---------------------------------
alter table public.certificates    enable row level security;
alter table public.external_audits enable row level security;

drop policy if exists "certificates_company_access" on public.certificates;
create policy "certificates_company_access"
  on public.certificates for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

drop policy if exists "external_audits_company_access" on public.external_audits;
create policy "external_audits_company_access"
  on public.external_audits for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
