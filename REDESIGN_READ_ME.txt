LEMMA IMS - "Needs your attention" redesign (shorter, cleaner)
==============================================================
No database step. No new settings. Just replace files and push.

STEP 1  Unzip into C:\Users\skzat\Documents\LemmaIMS  and choose Replace.
        (folder "app")
STEP 2  Open a terminal and type, one line at a time:
          cd C:\Users\skzat\Documents\LemmaIMS
          git add .
          git commit -m "compact attention list"
          git push origin master
STEP 3  Vercel -> Deployments -> wait for "Ready". Then open your dashboard
        in a private window and press Ctrl+F5.

WHAT CHANGES
- Each item is ONE compact row (was 3 lines + a big button).
- The whole row is clickable. The action word sits at the right.
- Only 4 items show first; "Show N more" for the rest.
- A one-line summary at the top: "1 urgent · 2 this week · 3 to decide".
- The readiness numbers moved into a small card BESIDE the list, so the top
  of the page is much shorter.
- On phones the due label ("Due today") appears under each title.
