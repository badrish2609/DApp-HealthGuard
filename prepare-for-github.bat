@echo off
echo ========================================
echo Prepare Files for GitHub Upload
echo ========================================
echo.

echo This will create a folder structure ready for GitHub upload
echo.

set TEMP_DIR="C:\Users\maste\OneDrive\Desktop\DApp Final\GitHub_Ready"
set SOURCE_DIR="C:\Users\maste\OneDrive\Desktop\DApp Final\DApp\healthcareDapp"

echo Creating temporary directory structure...
mkdir %TEMP_DIR% 2>nul
mkdir "%TEMP_DIR%\DApp" 2>nul
mkdir "%TEMP_DIR%\DApp\healthcareDapp" 2>nul
mkdir "%TEMP_DIR%\DApp\healthcareDapp\api" 2>nul

echo.
echo Copying Docker configuration files...

REM Copy main Docker files
copy "%SOURCE_DIR%\Dockerfile" "%TEMP_DIR%\DApp\healthcareDapp\" >nul 2>&1
copy "%SOURCE_DIR%\docker-compose.yml" "%TEMP_DIR%\DApp\healthcareDapp\" >nul 2>&1
copy "%SOURCE_DIR%\docker-compose.railway.yml" "%TEMP_DIR%\DApp\healthcareDapp\" >nul 2>&1
copy "%SOURCE_DIR%\nginx.conf" "%TEMP_DIR%\DApp\healthcareDapp\" >nul 2>&1
copy "%SOURCE_DIR%\railway.toml" "%TEMP_DIR%\DApp\healthcareDapp\" >nul 2>&1
copy "%SOURCE_DIR%\railway.json" "%TEMP_DIR%\DApp\healthcareDapp\" >nul 2>&1
copy "%SOURCE_DIR%\.dockerignore" "%TEMP_DIR%\DApp\healthcareDapp\" >nul 2>&1
copy "%SOURCE_DIR%\.gitignore" "%TEMP_DIR%\DApp\healthcareDapp\" >nul 2>&1

REM Copy API Docker files
copy "%SOURCE_DIR%\api\Dockerfile" "%TEMP_DIR%\DApp\healthcareDapp\api\" >nul 2>&1
copy "%SOURCE_DIR%\api\.dockerignore" "%TEMP_DIR%\DApp\healthcareDapp\api\" >nul 2>&1
copy "%SOURCE_DIR%\api\railway.json" "%TEMP_DIR%\DApp\healthcareDapp\api\" >nul 2>&1

REM Copy deployment scripts and documentation
copy "%SOURCE_DIR%\*.bat" "%TEMP_DIR%\DApp\healthcareDapp\" >nul 2>&1
copy "%SOURCE_DIR%\*.sh" "%TEMP_DIR%\DApp\healthcareDapp\" >nul 2>&1
copy "%SOURCE_DIR%\*.md" "%TEMP_DIR%\DApp\healthcareDapp\" >nul 2>&1

echo ✅ Files copied successfully!
echo.

echo 📁 Ready-to-upload structure created at:
echo %TEMP_DIR%
echo.

echo 📋 What to do next:
echo 1. Open your existing GitHub repo: https://github.com/badrish2609/DApp-HealthGuard
echo 2. Navigate to: DApp/healthcareDapp/ folder
echo 3. Upload all files from: %TEMP_DIR%\DApp\healthcareDapp\
echo 4. Or use Git Bash with the commands in GIT_SYNC_GUIDE.md
echo.

echo Opening the prepared folder...
start "" "%TEMP_DIR%\DApp\healthcareDapp"

echo.
echo Opening your GitHub repo...
start https://github.com/badrish2609/DApp-HealthGuard/tree/main/DApp/healthcareDapp

echo.
echo 🎯 After uploading to GitHub, run deploy-from-github.bat to deploy to Railway!
echo.
pause