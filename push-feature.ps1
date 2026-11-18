param(
    [Parameter(Mandatory=$false)]
    [string]$Message,
    [Parameter(Mandatory=$false)]
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

# Determine current branch if not provided
if (-not $BranchName) {
    cd $RootDir
    $BranchName = (git rev-parse --abbrev-ref HEAD).Trim()
}

if (-not $BranchName -or $BranchName -eq "HEAD") {
    $BranchName = "main"
}

if (-not $Message) {
    $Message = "feat: updates on branch $BranchName"
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "PUSHING FEATURE BRANCH: $BranchName" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Frontend Standalone
Write-Host "`n[1/3] Pushing Frontend branch '$BranchName'..." -ForegroundColor Yellow
$frontendGit = "$RootDir\.git_standalone\frontend.git"
$frontendWorkTree = "$RootDir\VidyaOS-Frontend-patched\VidyaOS-main"
if (Test-Path $frontendGit) {
    git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" add -A
    $st = git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" status --porcelain
    if ($st) {
        git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" commit -m "$Message"
    }
    if ($Token) {
        git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" push -u "https://$($Token)@github.com/onebotyt/VidyaOS.git" "$BranchName"
    } else {
        git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" push -u origin "$BranchName"
    }
    Write-Host "SUCCESS: Frontend branch pushed (PR Link: https://github.com/onebotyt/VidyaOS/pull/new/$BranchName)" -ForegroundColor Green
}

# 2. Backend Standalone
Write-Host "`n[2/3] Pushing Backend branch '$BranchName'..." -ForegroundColor Yellow
$backendGit = "$RootDir\.git_standalone\backend.git"
$backendWorkTree = "$RootDir\VidyaOS_BackEnd-patched\VidyaOS_BackEnd-main"
if (Test-Path $backendGit) {
    git --git-dir="$backendGit" --work-tree="$backendWorkTree" add -A
    $st = git --git-dir="$backendGit" --work-tree="$backendWorkTree" status --porcelain
    if ($st) {
        git --git-dir="$backendGit" --work-tree="$backendWorkTree" commit -m "$Message"
    }
    if ($Token) {
        git --git-dir="$backendGit" --work-tree="$backendWorkTree" push -u "https://$($Token)@github.com/onebotyt/VidyaOS_BackEnd.git" "$BranchName"
    } else {
        git --git-dir="$backendGit" --work-tree="$backendWorkTree" push -u origin "$BranchName"
    }
    Write-Host "SUCCESS: Backend branch pushed (PR Link: https://github.com/onebotyt/VidyaOS_BackEnd/pull/new/$BranchName)" -ForegroundColor Green
}

# 3. Combined Root Ecosystem
Write-Host "`n[3/3] Pushing Root Ecosystem branch '$BranchName'..." -ForegroundColor Yellow
cd $RootDir
git add -A
$st = git status --porcelain
if ($st) {
    git commit -m "$Message"
}
if ($Token) {
    git push -u "https://$($Token)@github.com/onebotyt/Vidya.git" "$BranchName"
} else {
    git push -u origin "$BranchName"
}
Write-Host "SUCCESS: Root ecosystem branch pushed (PR Link: https://github.com/onebotyt/Vidya/pull/new/$BranchName)" -ForegroundColor Green

Write-Host "`nDone! Open the Pull Request links above to review and merge your changes into main." -ForegroundColor Cyan
