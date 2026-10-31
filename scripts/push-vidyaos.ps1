$gitExe = "C:\Users\hp\PortableGit\cmd\git.exe"
if (-not (Test-Path $gitExe)) {
    $gitExe = "git"
}

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
    Write-Error "❌ Unable to read GitHub credential token."
    exit 1
}

$pushUrl = "https://${token}@github.com/onebotyt/VidyaOS.git"
Write-Host "Pushing deployfolder/VidyaOS to https://github.com/onebotyt/VidyaOS.git..." -ForegroundColor Yellow
& $gitExe -C deployfolder/VidyaOS push $pushUrl main
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed deployfolder/VidyaOS to GitHub!" -ForegroundColor Green
} else {
    Write-Host "❌ Push failed." -ForegroundColor Red
}
