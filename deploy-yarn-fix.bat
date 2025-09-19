@echo off
echo Attempting Railway deployment with Yarn approach...

:: Save current Dockerfile
copy Dockerfile Dockerfile.npm.bak

:: Try Yarn approach
copy Dockerfile.yarn Dockerfile
git add .
git commit -m "Try yarn for platform compatibility"
git push origin main

echo Yarn Dockerfile has been pushed to GitHub
echo Check Railway deployment in a few minutes...
echo.
echo If Yarn approach fails, you can restore npm approach:
echo   copy Dockerfile.npm.bak Dockerfile
echo   git add .
echo   git commit -m "Restore npm approach"
echo   git push origin main

pause