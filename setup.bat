@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Healthcare DApp - Docker Setup
echo ========================================
echo.

echo 🔍 Checking system requirements...
echo.

REM Check Docker
echo [1/4] Checking Docker Desktop...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or running!
    echo.
    echo Please install Docker Desktop:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
echo ✅ Docker is installed and running

REM Check available ports
echo [2/4] Checking available ports...
netstat -an | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ Warning: Port 3000 is in use
) else (
    echo ✅ Port 3000 is available
)

netstat -an | findstr ":5000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ Warning: Port 5000 is in use
) else (
    echo ✅ Port 5000 is available
)

REM Check disk space
echo [3/4] Checking disk space...
for /f "tokens=3" %%a in ('dir /-c') do set bytes=%%a
if %bytes% lss 5000000000 (
    echo ⚠️ Warning: Less than 5GB free space available
) else (
    echo ✅ Sufficient disk space available
)

REM Check if model files exist
echo [4/4] Checking ML model files...
if exist "api\models\best_model.pth" (
    echo ✅ ML model files found
) else (
    echo ⚠️ Warning: ML model files not found
    echo The application will attempt to train models on first run
)

echo.
echo 🏗️ System check completed!
echo.

echo Starting Docker deployment...
call deploy.bat
pause
