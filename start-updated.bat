@echo off
REM ============================================================
REM  VidyaOS (Updated Website) Quick Start
REM  Launches Backend (port 3001) and Frontend (port 5001)
REM ============================================================

echo Starting Updated VidyaOS...
powershell -ExecutionPolicy Bypass -File "%~dp0deployfolder\start-all.ps1"
pause

