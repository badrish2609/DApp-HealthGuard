@echo off
echo ========================================
echo Healthcare DApp - Docker Deployment
echo ========================================
echo.

echo Checking Docker Desktop status...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running or not installed!
    echo Please make sure Docker Desktop is running.
    pause
    exit /b 1
)

echo ✅ Docker is running!
echo.

echo Building and starting the application...
echo This may take a few minutes on first run...
echo.

docker-compose down --remove-orphans
docker-compose up --build -d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 🎉 SUCCESS! Healthcare DApp is running!
    echo ========================================
    echo.
    echo 🌐 Frontend: http://localhost:3000
    echo 🔧 Backend API: http://localhost:5000
    echo 📊 Health Check: http://localhost:5000/health
    echo ⛓️ Ganache Blockchain: http://localhost:7545
    echo.
    echo ℹ️ To stop: run stop.bat
    echo ℹ️ To view logs: run logs.bat
    echo.
    echo Opening application in browser in 5 seconds...
    timeout /t 5 /nobreak >nul
    start http://localhost:3000
) else (
    echo.
    echo ❌ ERROR: Failed to start the application!
    echo Check the logs above for details.
    echo.
)

pause