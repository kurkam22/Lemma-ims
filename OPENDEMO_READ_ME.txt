LEMMA IMS - DEMO SWITCH (small update)
======================================
Adds ONE setting that opens the demo to everyone. 2 files. No database step.

STEP 1  Unzip into C:\Users\skzat\Documents\LemmaIMS and choose Replace.
STEP 2  Terminal, one line at a time:
          cd C:\Users\skzat\Documents\LemmaIMS
          git add .
          git commit -m "demo open switch"
          git push origin master
        Vercel -> Deployments -> wait for "Ready".

THE THREE MODES (Vercel -> Settings -> Environment Variables, then Redeploy)
  A) OPEN TO EVERYONE   add   DEMO_PUBLIC   =   true
  B) ID + PASSWORD      add   DEMO_ACCOUNTS =   test:test   (or your own pairs)
                        and make sure DEMO_PUBLIC is NOT set to true
  C) CLOSED             neither of the two set

To go from open back to private: delete DEMO_PUBLIC (or set it to false) and
Redeploy. Changes only take effect after a Redeploy.

Only the demo (sample data) is opened. The real platform (/dashboard) always
needs a real sign-in.
