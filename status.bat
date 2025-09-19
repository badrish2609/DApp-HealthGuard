@echo off
echo Healthcare DApp - Status Check
echo ========================================

echo Checking container status...
docker ps --filter "name=healthcare"

echo.
echo Checking container health...
docker inspect healthcare-backend --format="{{.State.Health.Status}}" 2>nul

echo.
echo Quick API test...
curl -s http://localhost:5000/health

echo.
echo Press any key to exit...
pause >nul