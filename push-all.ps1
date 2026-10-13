param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Pushing All Vidya Repositories" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Monorepo (Vidya)
Write-Host "Committing & Pushing Monorepo (onebotyt/Vidya)..." -ForegroundColor Yellow
Set-Location $RootDir
git add -A
$monoStatus = (git status --porcelain)
if ($monoStatus) {
    git commit -m $Message
    git push origin main
    Write-Host "Monorepo pushed to https://github.com/onebotyt/Vidya.git" -ForegroundColor Green
}
if (-not $monoStatus) {
    Write-Host "Monorepo has no uncommitted changes. Pushing any pending commits..." -ForegroundColor Gray
    git push origin main
}

# 2 & 3. Sync Standalone Repos
& "$RootDir\sync-separate-repos.ps1" -Message $Message
