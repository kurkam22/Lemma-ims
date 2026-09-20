LEMMA IMS - BATCH 15 + 16
=========================
Batch 15: CERTIFICATE CLOCK  (new page: Check & audit -> Certificate clock)
Batch 16: REQUIREMENTS       (new page: Check & audit -> Requirements)

This zip is CUMULATIVE: it contains everything built since Batch 12
(Batches 13-14, private mode, dashboard v2, and these two). Just replace files.
You do not need the older zips if you use this one.

STEP 1  Unzip into C:\Users\skzat\Documents\LemmaIMS and choose Replace.
        (folders app, lib, tests, supabase and the file middleware.ts)

STEP 2  Supabase -> SQL Editor -> New query. Paste and Run EACH file you have
        not run yet (safe to run twice):
          supabase\migration_issues.sql          (Report a problem)
          supabase\migration_certification.sql   (NEW - certificate + audits)
        Each should say "Success". They only add new tables.

STEP 3  In a terminal, one line at a time:
          cd C:\Users\skzat\Documents\LemmaIMS
          git add .
          git commit -m "batches 15 and 16"
          git push origin master
        Vercel -> Deployments -> wait for "Ready".

STEP 4  Test online (private window, signed in):
  A) Check & audit -> Certificate clock
     - Enter the two dates from your certificate, Save.
     - The clock appears. Add an audit by your certification body
       (type + date). It shows as a marker and in "Coming up".
     - Your Internal audits and Management review dates appear on the rings too.
  B) Check & audit -> Requirements
     - One square per requirement, coloured by your answers, documents and
       evidence. Click a square to see its trail and the next step.
  C) Dashboard: an audit within 45 days, or a certificate ending within
     180 days, now appears in "Needs your attention".

REMEMBER
- Squares use the SAME 20 requirements as your Gap assessment page, so
  both pages always agree.
- Colours are Lemma's own indicator - not an ISO score, not an auditor finding.
- The Certificate clock and the Requirements board are NEW screens. If you plan
  to protect them as designs, ask your patent attorney BEFORE showing them to
  anyone outside (they are only visible after you sign in).
