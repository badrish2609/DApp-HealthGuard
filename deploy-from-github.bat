@echo off
echo ========================================
echo DApp-HealthGuard - Railway Deployment
echo ========================================
echo.

echo Great! You already have your repository at:
echo https://github.com/badrish2609/DApp-HealthGuard
echo.

echo [STEP 1] Opening Railway for deployment...
echo.

echo 🚀 Follow these steps:
echo.
echo 1. Sign up/Login to Railway with GitHub
echo 2. Click "Deploy from GitHub repo"
echo 3. Select "badrish2609/DApp-HealthGuard"
echo 4. Railway will auto-detect your Docker setup
echo.

echo [STEP 2] Configure Services:
echo.
echo SERVICE 1 - Backend (Python Flask):
echo   ├── Root Directory: /DApp/healthcareDapp/api
echo   ├── Port: 5000
echo   └── Environment Variables:
echo       ├── FLASK_ENV=production
echo       └── PYTHONPATH=/app
echo.
echo SERVICE 2 - Frontend (React):
echo   ├── Root Directory: /DApp/healthcareDapp
echo   ├── Port: 80
echo   └── Environment Variables:
echo       ├── REACT_APP_API_URL=[YOUR-BACKEND-URL]
echo       └── NODE_ENV=production
echo.

echo [STEP 3] After deployment, you'll get:
echo   ├── Frontend: https://your-app-frontend.railway.app
echo   ├── Backend: https://your-app-backend.railway.app
echo   └── Health Check: https://your-backend.railway.app/health
echo.

echo Opening Railway.app...
start https://railway.app

echo.
echo 📖 For detailed instructions, check the deployment guide!
echo.
pause