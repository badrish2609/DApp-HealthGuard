@echo off
echo ========================================
echo Healthcare DApp - Public Demo Link
echo ========================================
echo.

echo This creates a temporary public link for your running app.
echo.

echo Checking if ngrok is installed...
ngrok version >nul 2>&1
if %errorlevel% neq 0 (
    echo ngrok not found. Installing ngrok...
    echo.
    echo Please download ngrok from: https://ngrok.com/download
    echo 1. Download ngrok for Windows
    echo 2. Extract to this folder
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ ngrok found!
echo.

echo Starting public tunnel for your healthcare app...
echo This will create a public URL that anyone can access.
echo.

echo Your app should be running at http://localhost:3000
echo Creating public tunnel...
echo.

ngrok http 3000

echo.
echo The public link will be shown above.
echo Share that link with anyone to demo your healthcare DApp!
echo.
pause