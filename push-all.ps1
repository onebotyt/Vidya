param(
    [Parameter(Mandatory=$false)]
    [string]$Message = "chore: sync latest updates across VidyaOS ecosystem",
    [Parameter(Mandatory=$false)]
    [string]$Token = $env:GITHUB_PAT,
    [Parameter(Mandatory=$false)]
    [switch]$SkipVerification
)

$RootDir = "E:\uiap\VidyaOS"
$env:PATH = "C:\Users\Lenovo\MinGit\cmd;$env:PATH"

if (-not $Token -and $env:GITHUB_TOKEN) {
    $Token = $env:GITHUB_TOKEN
}

# Pre-Push Integration & Zero-Break Verification Gate
if (-not $SkipVerification) {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "PRE-PUSH INTEGRATION & CODE INTEGRITY CHECK" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    
    $manifestTest = "$RootDir\backend\scripts\test-ui-manifest-sync.js"
    if (Test-Path $manifestTest) {
        Write-Host "Verifying UI Manifests, DOM Parity & API Contracts..." -ForegroundColor Yellow
        $null = node $manifestTest
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Verification failed! test-ui-manifest-sync.js reported issues." -ForegroundColor Red
            Write-Host "Aborting push to prevent broken code from merging into main." -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ UI Manifests & Contract Integrity Passed!" -ForegroundColor Green
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "PUSHING ALL VIDYAOS REPOSITORIES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Frontend Standalone (VidyaOS.git)
Write-Host "`n[1/3] Pushing Frontend (onebotyt/VidyaOS)..." -ForegroundColor Yellow
$frontendGit = "$RootDir\.git_standalone\frontend.git"
$frontendWorkTree = "$RootDir\frontend"
if (Test-Path $frontendGit) {
    git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" add -A
    $st = git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" status --porcelain
    if ($st) {
        git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" commit -m "$Message"
    }
    if ($Token) {
        git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" pull --rebase --autostash "https://$($Token)@github.com/onebotyt/VidyaOS.git" main
        git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" push "https://$($Token)@github.com/onebotyt/VidyaOS.git" main
    } else {
        git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" pull --rebase --autostash origin main
        git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" push origin main
    }
    Write-Host "SUCCESS: Frontend pushed to https://github.com/onebotyt/VidyaOS.git" -ForegroundColor Green
}

# 2. Backend Standalone (VidyaOS_BackEnd.git)
Write-Host "`n[2/3] Pushing Backend (onebotyt/VidyaOS_BackEnd)..." -ForegroundColor Yellow
$backendGit = "$RootDir\.git_standalone\backend.git"
$backendWorkTree = "$RootDir\backend"
if (Test-Path $backendGit) {
    git --git-dir="$backendGit" --work-tree="$backendWorkTree" add -A
    $st = git --git-dir="$backendGit" --work-tree="$backendWorkTree" status --porcelain
    if ($st) {
        git --git-dir="$backendGit" --work-tree="$backendWorkTree" commit -m "$Message"
    }
    if ($Token) {
        git --git-dir="$backendGit" --work-tree="$backendWorkTree" pull --rebase --autostash "https://$($Token)@github.com/onebotyt/VidyaOS_BackEnd.git" main
        git --git-dir="$backendGit" --work-tree="$backendWorkTree" push "https://$($Token)@github.com/onebotyt/VidyaOS_BackEnd.git" main
    } else {
        git --git-dir="$backendGit" --work-tree="$backendWorkTree" pull --rebase --autostash origin main
        git --git-dir="$backendGit" --work-tree="$backendWorkTree" push origin main
    }
    Write-Host "SUCCESS: Backend pushed to https://github.com/onebotyt/VidyaOS_BackEnd.git" -ForegroundColor Green
}

# 3. Combined Vidya Ecosystem (Vidya.git)
Write-Host "`n[3/3] Pushing Combined Ecosystem (onebotyt/Vidya)..." -ForegroundColor Yellow
cd $RootDir
git add -A
$st = git status --porcelain
if ($st) {
    git commit -m "$Message"
}
if ($Token) {
    git pull --rebase --autostash "https://$($Token)@github.com/onebotyt/Vidya.git" main
    git push "https://$($Token)@github.com/onebotyt/Vidya.git" main
} else {
    git pull --rebase --autostash origin main
    git push origin main
}
Write-Host "SUCCESS: Combined ecosystem pushed to https://github.com/onebotyt/Vidya.git" -ForegroundColor Green

Write-Host "`nAll 3 repositories synchronized successfully!" -ForegroundColor Cyan
