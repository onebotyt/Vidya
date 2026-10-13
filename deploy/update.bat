@echo off
REM =============================================================================
REM VidyaOS Server-Room Windows Host Auto-Updater (GitOps)
REM Usage: Double click or run deploy\update.bat
REM =============================================================================

echo ==========================================================
echo  VidyaOS Server Auto-Update Process Starting...
echo ==========================================================

echo [1/3] Pulling latest code from GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo [ERROR] Git pull failed. Check internet connection or credentials.
    pause
    exit /b %errorlevel%
)

echo [2/3] Rebuilding Docker containers with persistent volumes...
docker compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Docker compose build failed. Ensure Docker Desktop is running.
    pause
    exit /b %errorlevel%
)

echo [3/3] Cleaning up old images...
docker image prune -f

echo ==========================================================
echo  VidyaOS is successfully updated and running!
echo  Web Portal: http://localhost:3000
echo ==========================================================
pause
