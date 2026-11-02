$gitExe = "C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"

# Use CredReader from auto-push.ps1
$token = [CredReader]::ReadCred('GitHub - https://api.github.com/AkashK-Repo')
if (-not $token) {
    $token = [CredReader]::ReadCred('LegacyGeneric:target=GitHub - https://api.github.com/AkashK-Repo')
}

Push-Location deployfolder/VidyaOS
$authUrl = "https://${token}@github.com/onebotyt/VidyaOS.git"
& $gitExe push $authUrl main
Pop-Location
