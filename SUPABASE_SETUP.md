# Supabase Setup

This guide walks you through wiring Lemma IMS to a fresh Supabase project. Follow the steps in order — a couple of them depend on values from earlier ones.

## Prerequisites

- A free or paid [Supabase](https://supabase.com) account
- Local access to this repository
- Roughly 10 minutes

---

## 1. Create the Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) and sign in.
2. Click **New project**.
3. Pick an organisation, give the project a name (e.g. `lemma-ims-dev`), and choose a strong database password — **save it somewhere safe**, you cannot recover it.
4. Pick the **region closest to your users** (latency matters for browser → DB calls).
5. Leave the plan as Free for now. Click **Create new project** and wait ~2 minutes for provisioning.

---

## 2. Get your URL and keys

Once the project is ready:

1. In the left sidebar, go to **Project Settings → API**.
2. Copy these three values:
   - **Project URL** → goes to `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → goes to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret key** → goes to `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ The `service_role` key bypasses Row Level Security. Never ship it to the browser. Only use it in server-only code (route handlers, server actions, cron jobs).

---

## 3. Add the keys to `.env.local`

Open `.env.local` in the project root and fill in the three Supabase lines:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

You can leave the other keys (Anthropic, Stripe, Resend) empty for now — you only need them when you wire those features up.

After editing `.env.local`, restart your dev server (`npm run dev`) so Next.js picks up the new env values.

---

## 4. Run the database schema

The schema creates all eight application tables, the auth-signup trigger, RLS policies, and the wizard column extensions.

1. In Supabase, go to **SQL Editor**.
2. Click **New query**.
3. Open `supabase/schema.sql` from this repo and paste the **entire file** into the editor.
4. Click **Run** (or `Ctrl/Cmd + Enter`).
5. You should see "Success. No rows returned." If you see an error, read it carefully — usually it's a missing extension or a typo in a paste. Re-running the file is safe (every statement uses `if not exists` / `or replace` / `drop ... if exists`).

To verify, go to **Table Editor**. You should see: `companies`, `users`, `documents`, `gap_answers`, `evidence`, `capas`, `suppliers`, `activity_log`.

---

## 5. Create the `company-documents` storage bucket

This bucket holds files users upload during the setup wizard (step 1).

1. In Supabase, go to **Storage**.
2. Click **New bucket**.
3. Name: `company-documents`
4. **Public bucket:** leave **OFF** — these are sensitive company files.
5. Click **Create bucket**.

---

## 6. Add storage RLS policies

The bucket is private by default, which means *nobody* can read or write to it until you add policies. Lemma IMS uploads files at the path `<user_id>/<filename>`, so the policies below scope access to the user's own folder.

1. In Supabase, go to **SQL Editor** and run:

```sql
-- Authenticated users can upload to their own folder
create policy "company-documents authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'company-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own files
create policy "company-documents own read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'company-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can replace their own files (used by upsert-style uploads)
create policy "company-documents own update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'company-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'company-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
create policy "company-documents own delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'company-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

2. Verify in **Storage → Policies** that the four `company-documents …` policies are listed and enabled.

> If you re-run the SQL above and get "policy … already exists", drop the existing policy first (`drop policy "name" on storage.objects;`) and re-create. The policies are idempotent in concept, but Supabase doesn't accept `if not exists` on `create policy`.

---

## 7. Verify the full flow

With the database, storage, and keys in place:

1. Start the dev server: `npm run dev`
2. Visit `http://localhost:3001/register` and create an account.
3. Check Supabase → **Authentication → Users** — your new user appears.
4. Check **Table Editor → users** — there should be a matching row (the `on_auth_user_created` trigger fires on signup).
5. Sign in, you should land at `/dashboard`.
6. Go to setup → step 1, fill the form, drop a PDF or DOCX file.
7. Check Supabase → **Storage → company-documents** — your file is there under your `user_id/` prefix.
8. Click Continue. Check **Table Editor → companies** — your company row exists with `setup_step = 1`.

If all eight steps pass, you're set.

---

## Troubleshooting

**"new row violates row-level security policy"**
A query is hitting a table whose RLS policies don't match the row's `company_id`. Most often happens right after signup, before the user is linked to a company. Check the `public.users` row's `company_id` is set after step 1 of the wizard.

**"JWSError JWSInvalidSignature" / "Invalid API key"**
The `anon` or `service_role` key in `.env.local` is from a different project. Re-copy from **Project Settings → API**.

**Files upload but the user can't see them again**
The storage RLS read policy is missing or scoped wrong. Re-run step 6.

**The auth trigger never fires**
The trigger lives on `auth.users`, not `public.users`. If you re-ran the schema after deleting just `public.users`, the trigger is still there — but if you reset the entire database, re-run `supabase/schema.sql` in full.

**Dev server doesn't pick up changes to `.env.local`**
Stop and restart `npm run dev`. Next.js only reads `.env.local` at startup.
