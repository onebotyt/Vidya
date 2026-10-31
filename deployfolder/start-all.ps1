# VidyaOS Deploy Folder — Quick Start (PowerShell)
# ====================================================
# Launches backend (:3001) and frontend (:5001) in separate windows.
# Run: .\start-all.ps1

$deployRoot = (Resolve-Path (Split-Path -Parent $MyInvocation.MyCommand.Path)).Path

Write-Host ""
Write-Host "  Starting VidyaOS Backend  → http://localhost:3001" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$deployRoot\VidyaOS_BackEnd'; node server.js" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "  Starting VidyaOS Frontend → http://localhost:5001" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$deployRoot\VidyaOS'; node server.js" -WindowStyle Normal

Write-Host ""
Write-Host "  +------------------------------------------------------+" -ForegroundColor White
Write-Host "  |  VidyaOS (deployfolder) -- Both servers launched!    |" -ForegroundColor White
Write-Host "  |                                                      |" -ForegroundColor White
Write-Host "  |  Backend  (API)      : http://localhost:3001         |" -ForegroundColor White
Write-Host "  |  Frontend (UI)       : http://localhost:5001         |" -ForegroundColor White
Write-Host "  |                                                      |" -ForegroundColor White
Write-Host "  |  Updated Admin Portal: http://localhost:5001/admin   |" -ForegroundColor White
Write-Host "  +------------------------------------------------------+" -ForegroundColor White
Write-Host ""

