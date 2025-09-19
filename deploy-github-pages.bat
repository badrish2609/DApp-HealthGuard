@echo off
echo ========================================
echo   GITHUB PAGES DEPLOYMENT SCRIPT
echo ========================================
echo.
cd /d "C:\Users\maste\OneDrive\Desktop\DApp Final\DApp\healthcareDapp"
echo Current directory: %CD%
echo.
echo Step 1: Building React app...
call npm run build
echo.
echo Step 2: Deploying to GitHub Pages...
call npm run deploy
echo.
echo ========================================
if %ERRORLEVEL% EQU 0 (
    echo ✅ SUCCESS! Your app should be live at:
    echo https://badrish2609.github.io/DApp-HealthGuard
    echo.
    echo It may take 5-10 minutes to be available.
    echo You also need to enable GitHub Pages in repository settings.
) else (
    echo ❌ Deployment failed. Check the error messages above.
)
echo ========================================
echo.
pause