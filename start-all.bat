@echo off
title VidyaOS Launcher (Main Repository)
echo ===================================================
echo           VidyaOS Campus Operating System
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking MySQL database...
"C:\xampp\mysql\bin\mysqladmin.exe" -u root ping >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting XAMPP MySQL daemon...
    start "" /b "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
    timeout /t 3 /nobreak >nul
) else (
    echo MySQL is already running.
)

echo [2/3] Starting VidyaOS Backend Server on port 3000...
start "VidyaOS Backend (Port 3000)" cmd /k "cd /d ""%~dp0backend"" && node server.js"

echo [3/3] Starting VidyaOS Frontend Server on port 5000...
start "VidyaOS Frontend (Port 5000)" cmd /k "cd /d ""%~dp0frontend"" && node server.js"

timeout /t 2 /nobreak >nul
echo.
echo ===================================================
echo VidyaOS is running!
echo Access the application at: http://localhost:5000
echo Backend API at:            http://localhost:3000
echo ===================================================
echo.
start http://localhost:5000
