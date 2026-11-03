param(
    [string]$Message = "feat(student): expand subject card with NBA, Theory Classes, and Laboratory Classes navigation and dedicated pages"
)

$gitExe = "C:\Users\hp\PortableGit\cmd\git.exe"
if (-not (Test-Path $gitExe)) {
    $gitExe = "git"
}

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
    Write-Error "Unable to read GitHub credential token from Windows Credential Manager."
    exit 1
}

# 2. Push deployfolder/VidyaOS (Frontend)
Write-Host "Staging and committing deployfolder/VidyaOS..." -ForegroundColor Cyan
& $gitExe -C deployfolder/VidyaOS add -A
$frontStatus = (& $gitExe -C deployfolder/VidyaOS status --porcelain).Trim()
if ($frontStatus) {
    & $gitExe -C deployfolder/VidyaOS commit -m $Message
}
Write-Host "Pushing deployfolder/VidyaOS to GitHub (onebotyt/VidyaOS)..." -ForegroundColor Cyan
$frontUrl = "https://${token}@github.com/onebotyt/VidyaOS.git"
& $gitExe -C deployfolder/VidyaOS push $frontUrl main:main
$frontExit = $LASTEXITCODE
if ($frontExit -eq 0) {
    $sha = (& $gitExe -C deployfolder/VidyaOS rev-parse --short HEAD).Trim()
    Write-Host "VidyaOS pushed successfully (Commit: $sha) -> Live on Vercel!" -ForegroundColor Green
} else {
    Write-Host "Failed to push VidyaOS ($frontExit)" -ForegroundColor Red
}

# 3. Push deployfolder/VidyaOS_BackEnd (Backend)
Write-Host "Staging and committing deployfolder/VidyaOS_BackEnd..." -ForegroundColor Cyan
& $gitExe -C deployfolder/VidyaOS_BackEnd add -A
$backStatus = (& $gitExe -C deployfolder/VidyaOS_BackEnd status --porcelain).Trim()
if ($backStatus) {
    & $gitExe -C deployfolder/VidyaOS_BackEnd commit -m $Message
}
Write-Host "Pushing deployfolder/VidyaOS_BackEnd to GitHub (onebotyt/VidyaOS_BackEnd)..." -ForegroundColor Cyan
$backUrl = "https://${token}@github.com/onebotyt/VidyaOS_BackEnd.git"
& $gitExe -C deployfolder/VidyaOS_BackEnd push $backUrl main:main
$backExit = $LASTEXITCODE
if ($backExit -eq 0) {
    $shaB = (& $gitExe -C deployfolder/VidyaOS_BackEnd rev-parse --short HEAD).Trim()
    Write-Host "VidyaOS_BackEnd pushed successfully (Commit: $shaB) -> Live on Render!" -ForegroundColor Green
} else {
    Write-Host "Failed to push VidyaOS_BackEnd ($backExit)" -ForegroundColor Red
}

# 4. Push Monorepo
Write-Host "Pushing Monorepo..." -ForegroundColor Cyan
& ".\scripts\auto-push.ps1" -Message $Message

