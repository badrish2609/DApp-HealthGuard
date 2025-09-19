@echo off
echo ========================================
echo Healthcare DApp - GitHub Setup Helper
echo ========================================
echo.

echo This script helps you prepare for GitHub upload and Railway deployment.
echo.

echo [STEP 1] Checking your project structure...
if exist "Dockerfile" (
    echo ✅ Frontend Dockerfile found
) else (
    echo ❌ Frontend Dockerfile missing
)

if exist "api\Dockerfile" (
    echo ✅ Backend Dockerfile found
) else (
    echo ❌ Backend Dockerfile missing
)

if exist "docker-compose.yml" (
    echo ✅ Docker Compose configuration found
) else (
    echo ❌ Docker Compose configuration missing
)

if exist ".gitignore" (
    echo ✅ .gitignore file ready
) else (
    echo ❌ .gitignore file missing
)

echo.
echo [STEP 2] Your project is ready for GitHub upload!
echo.
echo 📋 Next Steps:
echo 1. Go to https://github.com/new
echo 2. Create a repository named "healthcare-dapp"
echo 3. Make it PUBLIC (required for Railway free tier)
echo 4. Upload all files from this folder
echo.
echo 📁 Files to upload:
echo   ├── src/                 (React frontend)
echo   ├── api/                 (Python backend)
echo   ├── public/              (Static files)
echo   ├── Dockerfile           (Frontend container)
echo   ├── docker-compose.yml   (Local development)
echo   ├── railway.toml         (Railway config)
echo   ├── .gitignore          (Git ignore rules)
echo   ├── *.bat               (Helper scripts)
echo   ├── *.md                (Documentation)
echo   └── package.json        (Dependencies)
echo.
echo 🚀 After GitHub upload:
echo 1. Go to https://railway.app
echo 2. Sign up with GitHub
echo 3. Click "Deploy from GitHub repo"
echo 4. Select your healthcare-dapp repository
echo 5. Wait 10 minutes for deployment
echo 6. Get your live link!
echo.
echo 📖 Read RAILWAY_DEPLOYMENT_GUIDE.md for detailed instructions.
echo.

set /p continue="Ready to proceed? (y/n): "
if /i "%continue%"=="y" (
    echo.
    echo Opening GitHub in your browser...
    start https://github.com/new
    echo.
    echo Opening Railway in another tab...
    timeout /t 3 /nobreak >nul
    start https://railway.app
    echo.
    echo Follow the steps in RAILWAY_DEPLOYMENT_GUIDE.md
) else (
    echo.
    echo No problem! Run this script again when you're ready.
)

echo.
pause