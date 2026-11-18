param(
    [string]$Message = "fix(hod): resolve bulk student import 400 validation, MySQL NOCASE collation, and slot_id parity"
)

$gitExe = "C:\Users\hp\PortableGit\cmd\git.exe"
if (-not (Test-Path $gitExe)) {
    $gitExe = "git"
}

$RootDir = Split-Path -Parent $PSScriptRoot

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 Auto Push Ecosystem: VidyaOS + BackEnd" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Retrieve GitHub Token from Windows Credential Vault
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class CredReaderEco {
    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public long LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }

    public static string ReadCred(string target) {
        IntPtr credPtr;
        if (CredRead(target, 1, 0, out credPtr)) {
            CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
            if (cred.CredentialBlob != IntPtr.Zero && cred.CredentialBlobSize > 0) {
                byte[] bytes = new byte[cred.CredentialBlobSize];
                Marshal.Copy(cred.CredentialBlob, bytes, 0, cred.CredentialBlobSize);
                return System.Text.Encoding.UTF8.GetString(bytes);
            }
        }
        return null;
    }
}
'@

$token = [CredReaderEco]::ReadCred('GitHub - https://api.github.com/AkashK-Repo')
if (-not $token) {
    $token = [CredReaderEco]::ReadCred('LegacyGeneric:target=GitHub - https://api.github.com/AkashK-Repo')
}

if (-not $token) {
    Write-Error "❌ Unable to read GitHub credential token from Windows Credential Manager."
    exit 1
}

# --- Function to push a repository ---
function Push-Repo($repoPath, $remoteName, $branchName) {
    Write-Host "`n>>> Processing repository: $remoteName ($branchName) at $repoPath" -ForegroundColor Yellow
    Push-Location $repoPath
    try {
        $statusRaw = & $gitExe status --porcelain
        $status = if ($statusRaw) { $statusRaw.Trim() } else { "" }
        if ($status) {
            Write-Host "Staging and committing local changes in $repoPath..." -ForegroundColor Yellow
            & $gitExe add -A
            & $gitExe commit -m $Message
        }

        $authUrl = "https://${token}@github.com/onebotyt/${remoteName}.git"
        Write-Host "Pushing $branchName to https://github.com/onebotyt/${remoteName}.git..." -ForegroundColor Yellow
        & $gitExe push $authUrl "${branchName}:${branchName}"
        if ($LASTEXITCODE -eq 0) {
            $sha = (& $gitExe rev-parse --short HEAD).Trim()
            Write-Host "✅ $remoteName pushed successfully: commit $sha" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to push $remoteName (exit code $LASTEXITCODE)" -ForegroundColor Red
        }
    } finally {
        Pop-Location
    }
}

# 1. Push VidyaOS_BackEnd (triggers Render deployment)
Push-Repo "$RootDir\deployfolder\VidyaOS_BackEnd" "VidyaOS_BackEnd" "main"

# 2. Push VidyaOS (triggers Vercel deployment)
Push-Repo "$RootDir\deployfolder\VidyaOS" "VidyaOS" "main"

# 3. Push Root Repo
Push-Repo "$RootDir" "Vidya" "feature/student-dashboard-redesign"

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "🎉 Ecosystem Push Complete!" -ForegroundColor Green
Write-Host "Render & Vercel builds will automatically trigger." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
