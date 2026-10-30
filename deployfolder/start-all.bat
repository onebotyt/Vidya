@echo off
REM ============================================================
REM  VidyaOS Deploy-Folder Quick Start
REM  Launches backend (port 3001) and frontend (port 5001)
REM  in two separate terminal windows.
REM ============================================================

echo Starting VidyaOS Backend on port 3001...
start "VidyaOS Backend :3001" cmd /k "cd /d %~dp0VidyaOS_BackEnd && node server.js"

timeout /t 2 /nobreak >nul

echo Starting VidyaOS Frontend Dev Server on port 5001...
start "VidyaOS Frontend :5001" cmd /k "cd /d %~dp0VidyaOS && node server.js"

echo.
echo -------------------------------------------------------
echo  Backend  : http://localhost:3001
echo  Frontend : http://localhost:5001
echo -------------------------------------------------------
echo  (This window can be closed. Servers run in their own windows.)
echo.
pause

