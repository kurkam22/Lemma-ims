LEMMA IMS - BATCHES 13 + 14 (together)
======================================
Batch 13: "Needs your attention" home screen
Batch 14: "Report a problem" (staff log in, manager assigns, fixes, checks, closes)

This zip contains BOTH batches, so it does not matter whether you already
applied Batch 13. Just replace the files.

DO NOT RUN "git push". Keep everything on your computer for now.

STEP 1 - Copy the files
  Close "npm run dev". Unzip this file. Copy the folders  app, lib, tests, supabase
  into C:\Users\skzat\Documents\LemmaIMS  and choose "Replace".

STEP 2 - Add the new tables in Supabase (once)
  supabase.com -> your project -> SQL Editor -> New query.
  Open the file  supabase\migration_issues.sql  in Notepad, copy ALL of it,
  paste it in the SQL Editor, press Run.
  You should see "Success. No rows returned". It is safe to run twice.
  What it adds: a table for problems, a table for links to ISO requirements,
  and a private folder for photos. It does not change any existing table,
  and your live site does not use the new tables yet.

STEP 3 - Try it on your computer
  npm run dev     then open http://localhost:3001/dashboard
  a) Click "Report a problem". Write a sentence, choose where, add a photo
     if you like, press "Send for review".
  b) Open the problem in the list. Choose an owner and a due date.
     Press "Start work".
  c) Write what was done, press "Mark as fixed".
  d) Write how you checked it, press "Check result and close".
  e) On another problem press "Raise a corrective action" and look for it on
     the Corrective actions page.
  f) Look at the "May relate to ISO 9001:2015" chips and press Confirm.
  g) Go back to the Dashboard: open problems appear in "Needs your attention".

  To test as a second person (a staff member):
  - Add  REGISTRATION_OPEN=true  to your .env.local file, restart npm run dev,
    and register a second account with another email. (Only if you applied the
    private-mode zip. Remove that line afterwards.)
  - Then in Supabase SQL Editor run (change the email):
      update public.users
         set company_id = (select company_id from public.users where email = 'YOUR-EMAIL'),
             role = 'member'
       where email = 'SECOND-EMAIL';
  - Sign in as that person: they can report problems and see the list, but
    cannot change a problem unless they are its owner.

STEP 4 - Check and save locally
  Ctrl+C, then:  npm run build   (must end without errors)
  git add .
  git commit -m "batches 13 and 14"
  Then STOP. No git push.

OPTIONAL CHECKS
  npx tsx tests/attention.test.ts   -> attention tests passed
  npx tsx tests/issues.test.ts      -> issues tests passed

NOT IN THIS BATCH (next): email to the owner when a problem is assigned, an AI
helper for asking missing questions, and a no-login QR link for the shop floor.
