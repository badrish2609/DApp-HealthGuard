@echo off
echo Stopping Healthcare DApp containers...

docker-compose down

echo ✅ Healthcare DApp stopped!
echo.
echo To start again, run: deploy.bat
pause