@echo off
echo ========================================
echo Final FSEvents Fix - Use --omit=optional
echo ========================================
echo.

echo Using npm's own suggested solution from the warning message!
echo.

echo Fix applied:
echo ✅ Removed .npmrc approach (wasn't working)
echo ✅ Used npm ci --omit=optional (npm's own suggestion)
echo ✅ This excludes fsevents completely
echo ✅ Should work perfectly on Railway Linux
echo.

cd "C:\Users\maste\OneDrive\Desktop\DApp Final\DApp\healthcareDapp"

git add Dockerfile
git commit -m "Use npm ci --omit=optional to exclude fsevents (npm's suggested solution)"
git push origin master:main

if %errorlevel% equ 0 (
    echo.
    echo ✅ Final fsevents fix pushed successfully!
    echo.
    echo 🚀 This uses npm's own recommended flag from the warning:
    echo    "Use --omit=optional to exclude optional dependencies"
    echo.
    echo Go to Railway and redeploy - this should work!
    echo.
    
    start https://railway.app/dashboard
) else (
    echo ❌ Failed to push fix
)

echo.
pause