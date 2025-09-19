@echo off
echo ========================================
echo Fix Railway Nginx Issue
echo ========================================
echo.

echo The nginx configuration has been fixed to work with Railway.
echo.

echo Changes made:
echo ✅ Updated nginx.conf to remove backend upstream dependency
echo ✅ Updated Dockerfile to handle Railway's PORT variable  
echo ✅ Simplified configuration for Railway deployment
echo.

echo Pushing fixes to GitHub...
echo.

cd "C:\Users\maste\OneDrive\Desktop\DApp Final\DApp\healthcareDapp"

git add nginx.conf Dockerfile
git commit -m "Fix Railway deployment: Remove nginx upstream dependency"
git push origin master:main

if %errorlevel% equ 0 (
    echo.
    echo ✅ Fixes pushed to GitHub successfully!
    echo.
    echo 🚀 Next steps:
    echo 1. Go to Railway dashboard
    echo 2. Redeploy the frontend service
    echo 3. The nginx error should be resolved
    echo.
    echo 🌐 Alternative: Deploy services separately
    echo   - Frontend: Just serves the React build
    echo   - Backend: Standalone Flask API  
    echo   - Frontend calls backend via REACT_APP_API_URL
    echo.
    
    start https://railway.app/dashboard
) else (
    echo ❌ Failed to push to GitHub
    echo Please check your git configuration
)

echo.
pause