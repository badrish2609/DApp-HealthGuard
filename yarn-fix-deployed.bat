@echo off
echo ========================================
echo   YARN DOCKERFILE NOW DEPLOYED TO MAIN
echo ========================================
echo.
echo ✅ The yarn-based Dockerfile is now on the 'main' branch
echo ✅ Railway should now use yarn instead of npm
echo ✅ This should resolve the fsevents platform error
echo.
echo What changed:
echo - FROM: npm ci --omit=optional (failed)
echo - TO:   yarn install --ignore-optional (should work)
echo.
echo ========================================
echo Next Steps:
echo 1. Go back to Railway dashboard
echo 2. Click "Redeploy" again
echo 3. Watch build logs for "yarn install --ignore-optional"
echo 4. Should see successful build this time!
echo ========================================
echo.
echo Repository status:
git log --oneline -2
echo.
pause