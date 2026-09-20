LEMMA IMS - ENTRANCE ONLY (small update on top of "lemma-latest" you already deployed)
=====================================================================================
Adds the ID + password entrance page for the demo. 6 files. No database step.

STEP 1  Unzip into C:\Users\skzat\Documents\LemmaIMS and choose Replace.
STEP 2  Terminal, one line at a time:
          cd C:\Users\skzat\Documents\LemmaIMS
          git add .
          git commit -m "entrance with id and password"
          git push origin master
STEP 3  Vercel -> Settings -> Environment Variables -> Add
          Name:  DEMO_ACCOUNTS
          Value: attorney:Hd83kQ2mZ, oasis:Pw47xN9aB
                 (ID:password, several separated by commas; English letters
                  and numbers only). Tick Production. Save.
        Then Deployments -> newest -> three dots -> Redeploy.
STEP 4  Private window -> lemma-ims.vercel.app/demo -> enter an ID and password.
