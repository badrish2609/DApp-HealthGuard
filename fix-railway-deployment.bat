@echo off
echo ========================================
echo Railway Deployment Fix Helper
echo ========================================
echo.

echo Creating Railway-optimized files...
echo.

echo [STEP 1] Check what failed:
echo 1. Go to Railway dashboard
echo 2. Click on failed service
echo 3. Check "Deployments" tab
echo 4. Look at the error logs
echo.

echo [STEP 2] Common fixes:
echo.
echo Backend Service (if it crashed):
echo   - Root Directory: DApp/healthcareDapp/api
echo   - Port: 5000
echo   - Environment: FLASK_ENV=production
echo.
echo Frontend Service (if it crashed):
echo   - Root Directory: DApp/healthcareDapp  
echo   - Port: 80
echo   - Environment: NODE_ENV=production
echo.

echo [STEP 3] Try redeploying:
echo 1. Fix the settings above
echo 2. Click "Redeploy" in Railway
echo 3. Or delete service and recreate
echo.

echo Opening Railway dashboard...
start https://railway.app/dashboard

echo.
echo 📋 Next steps:
echo 1. Check your deployment logs
echo 2. Tell me the exact error message
echo 3. I'll provide specific fixes!
echo.
pause