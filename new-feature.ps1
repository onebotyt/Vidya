param(
    [Parameter(Mandatory=$true)]
    [string]$BranchName,
    [Parameter(Mandatory=$false)]
    [string]$Token = $env:GITHUB_PAT
)

$RootDir = $PSScriptRoot
if (-not $RootDir) { $RootDir = "E:\uiap\VidyaOS" }
$env:PATH = "C:\Users\Lenovo\MinGit\cmd;$env:PATH"

if (-not $Token -and $env:GITHUB_TOKEN) {
    $Token = $env:GITHUB_TOKEN
}

# Normalize branch name: e.g. feature/my-feature or dev2/my-feature
if ($BranchName -notmatch "^(feature|bugfix|hotfix|dev[1-9])\/") {
    $BranchName = "feature/$BranchName"
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "CREATING FEATURE BRANCH: $BranchName" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Frontend
Write-Host "`n[1/3] Frontend: Switching to $BranchName..." -ForegroundColor Yellow
$frontendGit = "$RootDir\.git_standalone\frontend.git"
$frontendWorkTree = "$RootDir\VidyaOS-Frontend-patched\VidyaOS-main"
if (Test-Path $frontendGit) {
    git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" checkout -b "$BranchName" 2>$null
    if ($LASTEXITCODE -ne 0) {
        git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" checkout "$BranchName"
    }
    Write-Host "Frontend is on branch: $BranchName" -ForegroundColor Green
}

# 2. Backend
Write-Host "`n[2/3] Backend: Switching to $BranchName..." -ForegroundColor Yellow
$backendGit = "$RootDir\.git_standalone\backend.git"
$backendWorkTree = "$RootDir\VidyaOS_BackEnd-patched\VidyaOS_BackEnd-main"
if (Test-Path $backendGit) {
    git --git-dir="$backendGit" --work-tree="$backendWorkTree" checkout -b "$BranchName" 2>$null
    if ($LASTEXITCODE -ne 0) {
        git --git-dir="$backendGit" --work-tree="$backendWorkTree" checkout "$BranchName"
    }
    Write-Host "Backend is on branch: $BranchName" -ForegroundColor Green
}

# 3. Combined Root
Write-Host "`n[3/3] Root Ecosystem: Switching to $BranchName..." -ForegroundColor Yellow
cd $RootDir
git checkout -b "$BranchName" 2>$null
if ($LASTEXITCODE -ne 0) {
    git checkout "$BranchName"
}
Write-Host "Root ecosystem is on branch: $BranchName" -ForegroundColor Green

Write-Host "`nFeature branch created across all repositories! You can now make your changes." -ForegroundColor Cyan
