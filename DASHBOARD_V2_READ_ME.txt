LEMMA IMS - Dashboard refresh (v2)
==================================
No database step. No new settings. Replace files and push.

STEP 1  Unzip into C:\Users\skzat\Documents\LemmaIMS and choose Replace.
        (folders "app", "lib", "tests")
STEP 2  In a terminal, one line at a time:
          cd C:\Users\skzat\Documents\LemmaIMS
          git add .
          git commit -m "dashboard refresh v2"
          git push origin master
STEP 3  Vercel -> Deployments -> wait for "Ready".
        Open your dashboard in a private window and press Ctrl+F5.

WHAT YOU WILL SEE
- Top: "Needs your attention" (compact rows) next to a READINESS card
  with a ring and a bar for each area.
- Below: three small cards - Where you stand, Last 30 days, Recent activity.
- The left menu is short: groups are closed and open with one click.
  A red number on a closed group shows how many actions are waiting.
- The button "Ask Lemma AI" was taken out of the menu: it did nothing.
- Duplicate menu items are HIDDEN, not deleted: "My selected standards" (same page as
  "Recommended standards") and "Improvement actions" (same page as "Reports").
  The pages still work.
- Cards have a softer border and a light shadow on every page.

ALL NUMBERS COME FROM YOUR OWN RECORDS. Nothing is estimated or invented.
You may delete the old file app\dashboard\_components\summary-card.tsx
(it is no longer used).
