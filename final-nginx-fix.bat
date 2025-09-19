@echo off
echo ========================================
echo Final Railway Nginx Fix
echo ========================================
echo.

echo This completely removes nginx upstream issues.
echo.

echo Changes:
echo ✅ Removed ALL upstream references from nginx.conf
echo ✅ Simplified Dockerfile with inline nginx config
echo ✅ No more backend dependencies in frontend
echo.

cd "C:\Users\maste\OneDrive\Desktop\DApp Final\DApp\healthcareDapp"

git add nginx.conf nginx.railway.conf Dockerfile
git commit -m "Final fix: Remove all nginx upstream dependencies for Railway"
git push origin master:main

if %errorlevel% equ 0 (
    echo.
    echo ✅ Final fix pushed successfully!
    echo.
    echo 🚀 The nginx upstream error should now be completely resolved.
    echo.
    echo Go to Railway and redeploy the frontend service.
    echo It should work without any nginx errors now!
    echo.
    
    start https://railway.app/dashboard
) else (
    echo ❌ Failed to push fixes
)

echo.
pause