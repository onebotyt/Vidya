@echo off
title VidyaOS Stopper
echo ===================================================
echo           Stopping VidyaOS Services
echo ===================================================
echo.

echo Stopping node processes on ports 3000 and 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo VidyaOS servers stopped.
pause
