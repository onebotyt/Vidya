<#
.SYNOPSIS
    Commits and pushes changes across all 3 repositories in one command:
    1. Unified Monorepo -> https://github.com/onebotyt/Vidya.git
    2. Frontend Repos   -> https://github.com/onebotyt/VidyaOS.git
    3. Backend Repos    -> https://github.com/onebotyt/VidyaOS_BackEnd.git

.EXAMPLE
    .\push-all.ps1 -Message "feat: add classroom auto-archive"
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 PUSHING ALL VIDYA REPOSITORIES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Monorepo (Vidya)
Write-Host "`n📦 [1/3] Committing & Pushing Monorepo (onebotyt/Vidya)..." -ForegroundColor Yellow
Set-Location $RootDir
git add -A
$monoStatus = git status --porcelain
if ($monoStatus) {
    git commit -m $Message
    git push origin main
    Write-Host "✅ Monorepo pushed to https://github.com/onebotyt/Vidya.git" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Monorepo has no uncommitted changes. Pushing any pending commits..." -ForegroundColor Gray
    git push origin main
}

# 2 & 3. Sync Standalone Repos
& "$RootDir\sync-separate-repos.ps1" -Message $Message
