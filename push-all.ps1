param(
    [Parameter(Mandatory=$false)]
    [string]$Message = "chore: sync latest updates across VidyaOS ecosystem",
    [Parameter(Mandatory=$false)]
    [string]$Token = ""
)

$RootDir = "E:\uiap\VidyaOS"
$env:PATH = "C:\Users\Lenovo\MinGit\cmd;$env:PATH"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔄 PUSHING ALL VIDYAOS REPOSITORIES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Frontend Standalone (VidyaOS.git)
Write-Host "`n📦 [1/3] Pushing Frontend (onebotyt/VidyaOS)..." -ForegroundColor Yellow
$frontendGit = "$RootDir\.git_standalone\frontend.git"
$frontendWorkTree = "$RootDir\VidyaOS-Frontend-patched\VidyaOS-main"
if (Test-Path $frontendGit) {
    git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" add -A
    $st = git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" status --porcelain
    if ($st) {
        git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" commit -m $Message
    }
    if ($Token) {
        git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" push "https://$($Token)@github.com/onebotyt/VidyaOS.git" main
    } else {
        git --git-dir="$frontendGit" --work-tree="$frontendWorkTree" push origin main
    }
    Write-Host "✅ Frontend pushed to https://github.com/onebotyt/VidyaOS.git" -ForegroundColor Green
}

# 2. Backend Standalone (VidyaOS_BackEnd.git)
Write-Host "`n📦 [2/3] Pushing Backend (onebotyt/VidyaOS_BackEnd)..." -ForegroundColor Yellow
$backendGit = "$RootDir\.git_standalone\backend.git"
$backendWorkTree = "$RootDir\VidyaOS_BackEnd-patched\VidyaOS_BackEnd-main"
if (Test-Path $backendGit) {
    git --git-dir="$backendGit" --work-tree="$backendWorkTree" add -A
    $st = git --git-dir="$backendGit" --work-tree="$backendWorkTree" status --porcelain
    if ($st) {
        git --git-dir="$backendGit" --work-tree="$backendWorkTree" commit -m $Message
    }
    if ($Token) {
        git --git-dir="$backendGit" --work-tree="$backendWorkTree" push "https://$($Token)@github.com/onebotyt/VidyaOS_BackEnd.git" main
    } else {
        git --git-dir="$backendGit" --work-tree="$backendWorkTree" push origin main
    }
    Write-Host "✅ Backend pushed to https://github.com/onebotyt/VidyaOS_BackEnd.git" -ForegroundColor Green
}

# 3. Combined Vidya Ecosystem (Vidya.git)
Write-Host "`n📦 [3/3] Pushing Combined Ecosystem (onebotyt/Vidya)..." -ForegroundColor Yellow
cd $RootDir
git add -A
$st = git status --porcelain
if ($st) {
    git commit -m $Message
}
if ($Token) {
    git push "https://$($Token)@github.com/onebotyt/Vidya.git" main
} else {
    git push origin main
}
Write-Host "✅ Combined ecosystem pushed to https://github.com/onebotyt/Vidya.git" -ForegroundColor Green

Write-Host "`n🎉 All 3 repositories synchronized successfully!" -ForegroundColor Cyan
