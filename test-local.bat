@echo off
echo ========================================
echo   TESTING DEPLOYMENT LOCALLY
echo ========================================
echo.
echo Current directory: %CD%
echo.
cd "C:\Users\maste\OneDrive\Desktop\DApp Final\DApp\healthcareDapp"
echo Changed to: %CD%
echo.
echo Testing React app locally...
npm start
pause