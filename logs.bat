@echo off
echo Healthcare DApp - Container Logs
echo ========================================
echo.
echo Choose which logs to view:
echo 1. Frontend (React)
echo 2. Backend (Python Flask)
echo 3. Ganache (Blockchain)
echo 4. All containers
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo Showing Frontend logs...
    docker logs -f healthcare-frontend
) else if "%choice%"=="2" (
    echo Showing Backend logs...
    docker logs -f healthcare-backend
) else if "%choice%"=="3" (
    echo Showing Ganache logs...
    docker logs -f healthcare-ganache
) else if "%choice%"=="4" (
    echo Showing all logs...
    docker-compose logs -f
) else (
    echo Invalid choice!
    pause
    exit /b 1
)