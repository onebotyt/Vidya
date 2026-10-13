param(
    [string]$Message = "sync: update from Vidya monorepo"
)

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Syncing Standalone Repositories" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Sync Frontend
Write-Host "Syncing Frontend (onebotyt/VidyaOS)..." -ForegroundColor Yellow
$FrontendGit = Join-Path $RootDir ".git_standalone\frontend.git"
$FrontendWorkTree = Join-Path $RootDir "frontend"

if (Test-Path $FrontendGit) {
    git --git-dir=$FrontendGit --work-tree=$FrontendWorkTree add -A
    $frontStatus = (git --git-dir=$FrontendGit --work-tree=$FrontendWorkTree status --porcelain)
    if ($frontStatus) {
        git --git-dir=$FrontendGit --work-tree=$FrontendWorkTree commit -m $Message
        git --git-dir=$FrontendGit --work-tree=$FrontendWorkTree push origin main
        Write-Host "Frontend pushed to https://github.com/onebotyt/VidyaOS.git" -ForegroundColor Green
    }
    if (-not $frontStatus) {
        Write-Host "Frontend is clean - no changes to push." -ForegroundColor Gray
    }
}

# 2. Sync Backend
Write-Host "Syncing Backend (onebotyt/VidyaOS_BackEnd)..." -ForegroundColor Yellow
$BackendGit = Join-Path $RootDir ".git_standalone\backend.git"
$BackendWorkTree = Join-Path $RootDir "backend"

if (Test-Path $BackendGit) {
    git --git-dir=$BackendGit --work-tree=$BackendWorkTree add -A
    $backStatus = (git --git-dir=$BackendGit --work-tree=$BackendWorkTree status --porcelain)
    if ($backStatus) {
        git --git-dir=$BackendGit --work-tree=$BackendWorkTree commit -m $Message
        git --git-dir=$BackendGit --work-tree=$BackendWorkTree push origin main
        Write-Host "Backend pushed to https://github.com/onebotyt/VidyaOS_BackEnd.git" -ForegroundColor Green
    }
    if (-not $backStatus) {
        Write-Host "Backend is clean - no changes to push." -ForegroundColor Gray
    }
}

Write-Host "Synchronization complete!" -ForegroundColor Green
