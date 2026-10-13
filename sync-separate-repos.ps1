<#
.SYNOPSIS
    Syncs the latest changes from backend/ and frontend/ to their respective standalone GitHub repositories.
    - frontend/ -> https://github.com/onebotyt/VidyaOS.git
    - backend/  -> https://github.com/onebotyt/VidyaOS_BackEnd.git

.EXAMPLE
    .\sync-separate-repos.ps1 -Message "feat: update classroom mobile layout"
#>
param(
    [string]$Message = "sync: update from Vidya monorepo"
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔄 SYNCING SEPARATE GITHUB REPOSITORIES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Sync Frontend
Write-Host "`n📦 [1/2] Syncing Frontend (onebotyt/VidyaOS)..." -ForegroundColor Yellow
$FrontendGit = Join-Path $RootDir ".git_standalone\frontend.git"
$FrontendWorkTree = Join-Path $RootDir "frontend"

if (Test-Path $FrontendGit) {
    git --git-dir=$FrontendGit --work-tree=$FrontendWorkTree add -A
    $frontStatus = git --git-dir=$FrontendGit --work-tree=$FrontendWorkTree status --porcelain
    if ($frontStatus) {
        git --git-dir=$FrontendGit --work-tree=$FrontendWorkTree commit -m $Message
        git --git-dir=$FrontendGit --work-tree=$FrontendWorkTree push origin main
        Write-Host "✅ Frontend pushed to https://github.com/onebotyt/VidyaOS.git" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Frontend is clean - no new changes to push." -ForegroundColor Gray
    }
} else {
    Write-Warning "Frontend git directory not found at $FrontendGit"
}

# 2. Sync Backend
Write-Host "`n📦 [2/2] Syncing Backend (onebotyt/VidyaOS_BackEnd)..." -ForegroundColor Yellow
$BackendGit = Join-Path $RootDir ".git_standalone\backend.git"
$BackendWorkTree = Join-Path $RootDir "backend"

if (Test-Path $BackendGit) {
    git --git-dir=$BackendGit --work-tree=$BackendWorkTree add -A
    $backStatus = git --git-dir=$BackendGit --work-tree=$BackendWorkTree status --porcelain
    if ($backStatus) {
        git --git-dir=$BackendGit --work-tree=$BackendWorkTree commit -m $Message
        git --git-dir=$BackendGit --work-tree=$BackendWorkTree push origin main
        Write-Host "✅ Backend pushed to https://github.com/onebotyt/VidyaOS_BackEnd.git" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Backend is clean - no new changes to push." -ForegroundColor Gray
    }
} else {
    Write-Warning "Backend git directory not found at $BackendGit"
}

Write-Host "`n🎉 Synchronization complete!" -ForegroundColor Green
