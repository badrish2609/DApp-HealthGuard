@echo off
echo ========================================
echo Sync Docker Files to GitHub Repository
echo ========================================
echo.

echo This script will help you push the Docker configuration files
echo to your GitHub repository: badrish2609/DApp-HealthGuard
echo.

echo [STEP 1] Checking if Git is installed...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed or not in PATH
    echo Please install Git from: https://git-scm.com/download/windows
    echo Or use Git Bash directly
    pause
    exit /b 1
)

echo ✅ Git is available
echo.

echo [STEP 2] Docker files to be uploaded:
echo   ├── Dockerfile (Frontend)
echo   ├── api/Dockerfile (Backend)
echo   ├── docker-compose.yml
echo   ├── docker-compose.railway.yml
echo   ├── nginx.conf
echo   ├── railway.toml
echo   ├── railway.json
echo   ├── .dockerignore
echo   ├── api/.dockerignore
echo   ├── .gitignore (updated)
echo   └── *.bat (deployment scripts)
echo.

echo [STEP 3] Commands to run in Git Bash:
echo.
echo 1. Navigate to your project directory:
echo    cd "C:/Users/maste/OneDrive/Desktop/DApp Final/DApp/healthcareDapp"
echo.
echo 2. Initialize git and add remote (if not done):
echo    git init
echo    git remote add origin https://github.com/badrish2609/DApp-HealthGuard.git
echo.
echo 3. Pull latest changes from GitHub:
echo    git pull origin main
echo.
echo 4. Copy your Docker files to the correct location in the repo structure
echo.
echo 5. Add and commit Docker files:
echo    git add .
echo    git commit -m "Add Docker configuration for Railway deployment"
echo.
echo 6. Push to GitHub:
echo    git push origin main
echo.

echo [STEP 4] Opening Git Bash for you...
echo.

set /p continue="Do you want me to open Git Bash in the project directory? (y/n): "
if /i "%continue%"=="y" (
    echo Opening Git Bash...
    cd /d "C:\Users\maste\OneDrive\Desktop\DApp Final\DApp\healthcareDapp"
    start "" "C:\Program Files\Git\bin\sh.exe" --login -i
) else (
    echo You can manually open Git Bash and run the commands above.
)

echo.
echo 📖 After pushing to GitHub, use deploy-from-github.bat to deploy to Railway!
echo.
pause