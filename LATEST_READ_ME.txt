LEMMA IMS - LATEST (use this zip; it contains everything)
=========================================================
Includes: Batches 13-16, private mode, dashboard v2, the Korean version, the
Certificate clock + Requirements panels on the dashboard, and a top-bar fix
for phones. You can ignore the older zips.

No database step. No new settings.

STEP 1  Unzip into C:\Users\skzat\Documents\LemmaIMS and choose Replace.
STEP 2  Terminal, one line at a time:
          cd C:\Users\skzat\Documents\LemmaIMS
          git add .
          git commit -m "latest: korean switch and dashboard"
          git push origin master
STEP 3  Vercel -> Deployments -> the newest one must say "Ready"
        (and its message must be "latest: korean switch and dashboard").
STEP 4  Open your dashboard, press Ctrl+F5.

HOW TO SEE KOREAN
  Top right of every dashboard page, next to the account icon:  EN | 한국어
  Press 한국어. The page reloads and the whole dashboard, menu and top bar are
  Korean. Press EN to go back. Your choice is remembered.

IF YOU DO NOT SEE "EN | 한국어":
  the new code is not live yet. Check Vercel -> Deployments. If the newest
  one says Error, open it and send me the log.

WHAT IS TRANSLATED: the dashboard, menu, top bar, the clock and requirements
panels, the sample workspace and the /demo page.
NOT YET: other pages (Problems, Gap assessment, Documents, Setup, Settings...),
login/register and the landing page.
