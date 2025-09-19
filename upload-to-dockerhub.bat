@echo off
echo ========================================
echo Healthcare DApp - Docker Hub Upload
echo ========================================
echo.

echo This script will upload your Docker images to Docker Hub
echo so others can easily run your healthcare DApp.
echo.

set /p username="Enter your Docker Hub username: "
if "%username%"=="" (
    echo Error: Username is required!
    pause
    exit /b 1
)

echo.
echo Logging into Docker Hub...
docker login

if %errorlevel% neq 0 (
    echo Failed to login to Docker Hub!
    pause
    exit /b 1
)

echo.
echo Tagging images...
docker tag healthcaredapp-backend:latest %username%/healthcare-backend:latest
docker tag healthcaredapp-frontend:latest %username%/healthcare-frontend:latest

echo.
echo Pushing backend image...
docker push %username%/healthcare-backend:latest

echo.
echo Pushing frontend image...
docker push %username%/healthcare-frontend:latest

echo.
echo ========================================
echo 🎉 SUCCESS! Images uploaded to Docker Hub
echo ========================================
echo.
echo 📤 Your images are now available at:
echo   - %username%/healthcare-backend:latest
echo   - %username%/healthcare-frontend:latest
echo.
echo 🔗 Share this command with others:
echo docker run -d --name healthcare-demo -p 3000:80 -p 5000:5000 %username%/healthcare-frontend:latest
echo.
echo 📋 Or share the Docker Hub URLs:
echo https://hub.docker.com/r/%username%/healthcare-backend
echo https://hub.docker.com/r/%username%/healthcare-frontend
echo.
pause