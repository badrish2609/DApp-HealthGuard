@echo off
echo ========================================
echo   RAILWAY PORT CONFIGURATION
echo ========================================
echo.
echo From your Railway settings image, I can see:
echo - You need to "Generate Service Domain"
echo - Current port setting: 8080
echo - But React apps usually need port 80
echo.
echo ========================================
echo CORRECT PORT FOR YOUR REACT APP:
echo.
echo Your Dockerfile uses nginx which serves on port 80
echo So you should change the port to: 80
echo.
echo Steps:
echo 1. Change "8080" to "80" in the Railway port field
echo 2. Click "Generate Domain" 
echo 3. Railway will create your live URL
echo.
echo ========================================
echo Why port 80?
echo.
echo Your Dockerfile ends with:
echo   FROM nginx:alpine
echo   EXPOSE 80
echo   CMD ["nginx", "-g", "daemon off;"]
echo.
echo Nginx serves on port 80 by default.
echo ========================================
echo.
pause