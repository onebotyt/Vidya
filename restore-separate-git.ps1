<#
.SYNOPSIS
    Restores standalone .git folders from .git_standalone back into backend/.git and frontend/.git.
    Use this if you ever wish to revert the on-disk monorepo to independent repository folders.
#>
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$FrontendBackup = Join-Path $RootDir ".git_standalone\frontend.git"
$FrontendDest = Join-Path $RootDir "frontend\.git"

$BackendBackup = Join-Path $RootDir ".git_standalone\backend.git"
$BackendDest = Join-Path $RootDir "backend\.git"

if (Test-Path $FrontendBackup) {
    Move-Item -Path $FrontendBackup -Destination $FrontendDest -Force
    Write-Host "✅ Restored frontend\.git" -ForegroundColor Green
}

if (Test-Path $BackendBackup) {
    Move-Item -Path $BackendBackup -Destination $BackendDest -Force
    Write-Host "✅ Restored backend\.git" -ForegroundColor Green
}

Write-Host "Standalone repositories restored on disk." -ForegroundColor Cyan
