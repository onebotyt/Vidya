param(
    [string]$Message = "update: synchronized latest changes to GitHub"
)

$gitExe = "C:\Users\hp\PortableGit\cmd\git.exe"
if (-not (Test-Path $gitExe)) {
    $altGit = "C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
    if (Test-Path $altGit) {
        $gitExe = $altGit
    } else {
        $gitExe = "git"
    }
}

$RootDir = Split-Path -Parent $PSScriptRoot

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 One-Click Auto Push: onebotyt/Vidya" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Retrieve GitHub Token securely from Windows Credential Vault
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class CredReader {
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

$token = [CredReader]::ReadCred('GitHub - https://api.github.com/AkashK-Repo')
if (-not $token) {
    $token = [CredReader]::ReadCred('LegacyGeneric:target=GitHub - https://api.github.com/AkashK-Repo')
}

if (-not $token) {
    Write-Error "❌ Unable to read GitHub credential token from Windows Credential Manager."
    exit 1
}

# 2. Check current branch
$branch = (& $gitExe rev-parse --abbrev-ref HEAD).Trim()
Write-Host "Active branch: $branch" -ForegroundColor Yellow

# 3. Check for uncommitted changes
$statusRaw = & $gitExe status --porcelain
$status = if ($statusRaw) { $statusRaw.Trim() } else { "" }
if ($status) {
    Write-Host "Staging and committing local changes..." -ForegroundColor Yellow
    & $gitExe add -A
    & $gitExe commit -m $Message
    Write-Host "Committed: $Message" -ForegroundColor Green
} else {
    Write-Host "Working tree is clean. Checking for pending commits..." -ForegroundColor Gray
}

# 4. Push to origin with authenticated token URL
$authUrl = "https://${token}@github.com/onebotyt/Vidya.git"
Write-Host "Pushing $branch to https://github.com/onebotyt/Vidya.git..." -ForegroundColor Yellow

& $gitExe push $authUrl "${branch}:${branch}"
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    $headSha = (& $gitExe rev-parse --short HEAD).Trim()
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Commit: $headSha" -ForegroundColor Green
    Write-Host "Branch: https://github.com/onebotyt/Vidya/tree/$branch" -ForegroundColor Cyan
    Write-Host "Pull Request: https://github.com/onebotyt/Vidya/pull/new/$branch`n" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Push failed with exit code $exitCode." -ForegroundColor Red
}

exit $exitCode
