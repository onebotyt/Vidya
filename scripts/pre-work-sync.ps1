# ==============================================================================
# Pre-Work Git Sync: Automatically checks for remote commits and updates code
# ==============================================================================

$gitExe = "C:\Users\hp\PortableGit\cmd\git.exe"
if (-not (Test-Path $gitExe)) {
    $gitExe = "git"
}

$RootDir = Split-Path -Parent $PSScriptRoot

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔄 Pre-Work Git Sync: Checking for Commits" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

function Sync-Repo($repoPath, $name, $branch) {
    Write-Host "`n>>> Checking repository: $name ($branch) at $repoPath" -ForegroundColor Yellow
    if (-not (Test-Path $repoPath)) {
        Write-Host "⚠️ Path not found: $repoPath" -ForegroundColor Red
        return
    }

    Push-Location $repoPath
    try {
        # Check local uncommitted changes
        $statusRaw = & $gitExe status --porcelain
        if ($statusRaw) {
            Write-Host "⚠️ Warning: Local uncommitted changes detected in $name." -ForegroundColor Yellow
        }

        # Fetch remote
        Write-Host "Fetching origin $branch..." -ForegroundColor Gray
        & $gitExe fetch origin $branch

        # Check commit differences
        $localSha = (& $gitExe rev-parse HEAD).Trim()
        $remoteSha = (& $gitExe rev-parse "origin/$branch").Trim()

        if ($localSha -ne $remoteSha) {
            $behindCount = (& $gitExe rev-list --count HEAD..origin/$branch).Trim()
            $aheadCount = (& $gitExe rev-list --count origin/$branch..HEAD).Trim()

            if ([int]$behindCount -gt 0) {
                Write-Host "⚡ Remote is ahead by $behindCount commit(s)! Updating with pull --rebase..." -ForegroundColor Green
                & $gitExe pull --rebase origin $branch
                if ($LASTEXITCODE -eq 0) {
                    $newSha = (& $gitExe rev-parse --short HEAD).Trim()
                    Write-Host "✅ Successfully updated $name to commit $newSha" -ForegroundColor Green
                } else {
                    Write-Host "❌ Conflict or error updating $name. Please resolve manually." -ForegroundColor Red
                }
            } elseif ([int]$aheadCount -gt 0) {
                Write-Host "ℹ️ Local is ahead of remote by $aheadCount commit(s). Ready to push when done." -ForegroundColor Cyan
            }
        } else {
            $currSha = (& $gitExe rev-parse --short HEAD).Trim()
            Write-Host "✅ $name is 100% up-to-date with origin/$branch (commit $currSha)." -ForegroundColor Green
        }
    } finally {
        Pop-Location
    }
}

# 1. Check Root Repo (Vidya)
$activeBranch = (& $gitExe rev-parse --abbrev-ref HEAD).Trim()
Sync-Repo $RootDir "Vidya" $activeBranch

# 2. Check Backend (VidyaOS_BackEnd)
Sync-Repo "$RootDir\deployfolder\VidyaOS_BackEnd" "VidyaOS_BackEnd" "main"

# 3. Check Frontend (VidyaOS)
Sync-Repo "$RootDir\deployfolder\VidyaOS" "VidyaOS" "main"

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "✨ Pre-Work Sync Check Complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
