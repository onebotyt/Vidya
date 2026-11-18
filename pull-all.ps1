param(
    [Parameter(Mandatory=$false)]
    [string]$Token = $env:GITHUB_PAT
)

$RootDir = $PSScriptRoot
if (-not $RootDir) { $RootDir = "E:\uiap\VidyaOS" }
$env:PATH = "C:\Users\Lenovo\MinGit\cmd;$env:PATH"

if (-not $Token -and $env:GITHUB_TOKEN) {
    $Token = $env:GITHUB_TOKEN
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "PULLING ALL VIDYAOS REPOSITORIES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Frontend Standalone (VidyaOS.git)
Write-Host "`n[1/3] Pulling Frontend (onebotyt/VidyaOS)..." -ForegroundColor Yellow
$frontendGit = "$RootDir\.git_standalone\frontend.git"
$frontendWorkTree = "$RootDir\frontend"
if (Test-Path $frontendGit) {
    if ($Token) {
        git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" pull --rebase "https://$($Token)@github.com/onebotyt/VidyaOS.git" main
    } else {
        git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" pull --rebase origin main
    }
    Write-Host "SUCCESS: Frontend updated from https://github.com/onebotyt/VidyaOS.git" -ForegroundColor Green
}

# 2. Backend Standalone (VidyaOS_BackEnd.git)
Write-Host "`n[2/3] Pulling Backend (onebotyt/VidyaOS_BackEnd)..." -ForegroundColor Yellow
$backendGit = "$RootDir\.git_standalone\backend.git"
$backendWorkTree = "$RootDir\backend"
if (Test-Path $backendGit) {
    if ($Token) {
        git --git-dir="$backendGit" --work-tree="$backendWorkTree" pull --rebase "https://$($Token)@github.com/onebotyt/VidyaOS_BackEnd.git" main
    } else {
        git --git-dir="$backendGit" --work-tree="$backendWorkTree" pull --rebase origin main
    }
    Write-Host "SUCCESS: Backend updated from https://github.com/onebotyt/VidyaOS_BackEnd.git" -ForegroundColor Green
}

# 3. Combined Vidya Ecosystem (Vidya.git)
Write-Host "`n[3/3] Pulling Combined Ecosystem (onebotyt/Vidya)..." -ForegroundColor Yellow
cd $RootDir
$st = git status --porcelain
if ($st) {
    Write-Host "Staging local root state changes before pulling..." -ForegroundColor Gray
    git add -A
    git commit -m "chore: sync root repository state before pulling"
}
if ($Token) {
    git pull --rebase "https://$($Token)@github.com/onebotyt/Vidya.git" main
} else {
    git pull --rebase origin main
}
Write-Host "SUCCESS: Combined ecosystem updated from https://github.com/onebotyt/Vidya.git" -ForegroundColor Green

Write-Host "`nAll 3 repositories pulled and up-to-date!" -ForegroundColor Cyan
