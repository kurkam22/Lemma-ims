LEMMA IMS - CLOCK + REQUIREMENTS ON THE DASHBOARD (replaces the metro map)
==========================================================================
This zip is CUMULATIVE: everything since Batch 12, including the Korean
version. You can use it on its own. No database step, no new settings.

STEP 1  Unzip into C:\Users\skzat\Documents\LemmaIMS and choose Replace.
STEP 2  Terminal, one line at a time:
          cd C:\Users\skzat\Documents\LemmaIMS
          git add .
          git commit -m "clock and requirements on dashboard"
          git push origin master
STEP 3  Vercel -> Deployments -> wait for "Ready". Then press Ctrl+F5.

WHAT YOU WILL SEE ON THE DASHBOARD (scroll down under the three small cards)
- LEFT: "Certificate clock" - three rings, one per year of your certificate,
  with audits and reviews on them, today's needle and the next event.
- RIGHT: "Requirements" - one square per requirement, grouped by part.
  Click a square to see its trail and what to do next.
- The metro map is gone from the dashboard and from /demo (the file is kept,
  just not shown).
- "Requirements" and "Certificate clock" are no longer in the left menu.
  Use "Manage dates" (on the clock) and "Open full page" (on Requirements).

IF THE CLOCK SAYS "Set up your certificate clock":
  it is waiting for your two certificate dates. Press "Enter certificate dates".
  (If that page says "not set up yet", run supabase\migration_certification.sql
  once in Supabase, then refresh.)

KOREAN: press 한국어 in the top bar. Both panels, all 20 requirement texts and
the month names are translated.
