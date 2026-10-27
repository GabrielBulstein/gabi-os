param(
    [string]$ReportPath,
    [string]$ResumeDirectory,
    [ValidatePattern('^[a-zA-Z0-9][a-zA-Z0-9.-]*$')][string]$HostName = '192.168.1.10',
    [ValidatePattern('^[a-z_][a-z0-9_-]*$')][string]$UserName = 'gabriel'
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'windows-paths.ps1')

function Assert-VerifiedBackupReport($Report, [string]$SourceUser) {
    if ($Report.schema -ne 1 -or $Report.kind -ne 'source-backup' -or $Report.success -ne $true -or $Report.verified -ne $true) {
        throw 'El informe no confirma un respaldo verificado. No se iniciara la transferencia.'
    }
    $pattern = '^/home/' + [regex]::Escape($SourceUser) + '/Backups/GabiOS/[0-9]{8}T[0-9]{6}Z-[0-9a-f]{8}/gabito-full\.tar\.gz\z'
    if ($Report.archive -notmatch $pattern -or $Report.sha256 -notmatch '^[0-9a-f]{64}\z') {
        throw 'La ruta o la huella del respaldo no tienen el formato esperado.'
    }
    if ($Report.bytes -le 0 -or $Report.bytes -gt 512MB) {
        throw 'Esta transferencia admite archivos de hasta 512 MiB. Hace falta otro procedimiento para este tamano.'
    }
}

function Protect-VerifiedArchive([string]$PlainPath, [string]$CipherPath, [string]$ExpectedHash) {
    Add-Type -AssemblyName System.Security
    if ((Get-FileHash -LiteralPath $PlainPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ExpectedHash) {
        throw 'La huella de la descarga no coincide con el respaldo. No se confirmo la copia.'
    }
    $plain = $null
    $roundtrip = $null
    $hasher = [Security.Cryptography.SHA256]::Create()
    try {
        $plain = [IO.File]::ReadAllBytes($PlainPath)
        $cipher = [Security.Cryptography.ProtectedData]::Protect($plain, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
        $output = [IO.File]::Open($CipherPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
        try { $output.Write($cipher, 0, $cipher.Length); $output.Flush() } finally { $output.Dispose() }
        $roundtrip = [Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($CipherPath), $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
        $actual = ([BitConverter]::ToString($hasher.ComputeHash($roundtrip))).Replace('-', '').ToLowerInvariant()
        if ($actual -ne $ExpectedHash) { throw 'Fallo la comprobacion de descifrado. No se confirmo la copia.' }
    } finally {
        if ($null -ne $plain) { [Array]::Clear($plain, 0, $plain.Length) }
        if ($null -ne $roundtrip) { [Array]::Clear($roundtrip, 0, $roundtrip.Length) }
        $hasher.Dispose()
    }
}

function New-PrivateBackupDirectory([string]$Path) {
    $directoryInfo = [IO.DirectoryInfo]::new($Path)
    if ($directoryInfo.Exists) { throw 'La carpeta privada ya existe. No se modificaran sus permisos.' }
    $acl = [Security.AccessControl.DirectorySecurity]::new()
    $acl.SetAccessRuleProtection($true, $false)
    $inherit = [Security.AccessControl.InheritanceFlags]'ContainerInherit,ObjectInherit'
    $allowed = @([Security.Principal.WindowsIdentity]::GetCurrent().User, [Security.Principal.SecurityIdentifier]::new('S-1-5-18'))
    foreach ($sid in $allowed) {
        $rule = [Security.AccessControl.FileSystemAccessRule]::new($sid, [Security.AccessControl.FileSystemRights]::FullControl, $inherit, [Security.AccessControl.PropagationFlags]::None, [Security.AccessControl.AccessControlType]::Allow)
        $acl.AddAccessRule($rule)
    }
    # Create with the private ACL already applied, without the Set-Acl module.
    if ($PSVersionTable.PSEdition -eq 'Desktop') {
        $directoryInfo.Create($acl)
    } else {
        [IO.FileSystemAclExtensions]::Create($directoryInfo, $acl)
    }
    Assert-PrivateBackupDirectory $Path
}

function Assert-PrivateBackupDirectory([string]$Path) {
    $directoryInfo = [IO.DirectoryInfo]::new($Path)
    if (!$directoryInfo.Exists -or ($directoryInfo.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'La carpeta privada no existe o es un enlace.' }
    $inherit = [Security.AccessControl.InheritanceFlags]'ContainerInherit,ObjectInherit'
    $allowed = @([Security.Principal.WindowsIdentity]::GetCurrent().User, [Security.Principal.SecurityIdentifier]::new('S-1-5-18'))
    if ($PSVersionTable.PSEdition -eq 'Desktop') { $actual = $directoryInfo.GetAccessControl() }
    else { $actual = [IO.FileSystemAclExtensions]::GetAccessControl($directoryInfo) }
    $rules = @($actual.GetAccessRules($true, $true, [Security.Principal.SecurityIdentifier]))
    if (!$actual.AreAccessRulesProtected -or $rules.Count -ne 2) { throw 'No se confirmaron los permisos privados. No se descargara el respaldo.' }
    foreach ($rule in $rules) {
        if ($rule.IdentityReference.Value -notin @($allowed.Value) -or $rule.IsInherited -or
            $rule.AccessControlType -ne [Security.AccessControl.AccessControlType]::Allow -or
            $rule.FileSystemRights -ne [Security.AccessControl.FileSystemRights]::FullControl -or
            $rule.InheritanceFlags -ne $inherit) { throw 'Los permisos no coinciden con la carpeta privada esperada.' }
    }
}

function Set-TransferIdentity([string]$Directory, $Report) {
    $path = Join-Path $Directory 'transfer-source.json'
    if (Test-Path -LiteralPath $path) {
        $previous = Get-Content -Raw -LiteralPath $path | ConvertFrom-Json
        if ($previous.sha256 -ne $Report.sha256 -or $previous.bytes -ne $Report.bytes -or $previous.archive -ne $Report.archive) {
            throw 'La descarga parcial pertenece a otro respaldo. No se reanudara.'
        }
    } else {
        # Legacy partials have no receipt; the full SHA-256 is still mandatory.
        $identity = @{schema=1;archive=$Report.archive;sha256=$Report.sha256;bytes=$Report.bytes}
        [IO.File]::WriteAllText($path, ($identity | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
    }
}

function Invoke-SftpResumeAttempt([string]$Directory, [string]$Archive, [string]$Target) {
    Push-Location -LiteralPath $Directory
    try {
        # BatchMode=no MUST precede -b so SSH can prompt on the local console.
        # Fixed basename and strictly validated source path prevent batch injection.
        @("reget $Archive gabito-full.tar.gz.partial", 'bye') | & sftp.exe -o BatchMode=no -b - -o StrictHostKeyChecking=yes -o ConnectTimeout=10 -o NumberOfPasswordPrompts=1 -o ServerAliveInterval=15 -o ServerAliveCountMax=6 -o TCPKeepAlive=yes -o IPQoS=none -R 1 -B 32768 -l 4096 $Target
        $code = $LASTEXITCODE
    } finally { Pop-Location }
    if ($code -ne 0) { throw "Conexion interrumpida. Se conserva lo descargado; reanudar con -ResumeDirectory `"$Directory`"." }
}

function Invoke-SftpResume([string]$Directory, [string]$Archive, [string]$Target, [ValidateRange(1,3)][int]$MaxAttempts=3) {
    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try { Invoke-SftpResumeAttempt $Directory $Archive $Target; return }
        catch {
            if ($attempt -eq $MaxAttempts) { throw }
            Write-Host "La conexion se interrumpio. Se conserva el avance. Intento $($attempt+1) de $MaxAttempts; puede pedir la contrasena otra vez."
        }
    }
}

function Invoke-BackupTransfer {
    $migration = (Get-GabiOsPaths).Migration
    if (!$ReportPath) {
        $latest = Get-ChildItem -LiteralPath $migration -Filter 'philco-backup-*.json' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (!$latest) { throw 'No se encontro el informe de respaldo.' }
        $ReportPath = $latest.FullName
    }
    $report = Get-Content -Raw -LiteralPath $ReportPath | ConvertFrom-Json
    Assert-VerifiedBackupReport $report $UserName
    $backupRoot = Join-Path $migration 'backups'
    New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
    if ((Get-Item -LiteralPath $backupRoot).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'La carpeta de respaldos es un enlace. Revisar antes de descargar.' }
    if ($ResumeDirectory) {
        $directory = [IO.Path]::GetFullPath($ResumeDirectory)
        if ([IO.Path]::GetDirectoryName($directory).TrimEnd('\') -ne [IO.Path]::GetFullPath($backupRoot).TrimEnd('\')) { throw 'La carpeta de reanudacion esta fuera del directorio privado de respaldos.' }
        Assert-PrivateBackupDirectory $directory
    } else {
        $directory = Join-Path $backupRoot ((Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0,8))
        New-PrivateBackupDirectory $directory
    }
    $lock = [IO.File]::Open((Join-Path $directory 'transfer.lock'), [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
    try {
    Set-TransferIdentity $directory $report
    $plainPath = Join-Path $directory 'gabito-full.tar.gz.partial'
    $cipherPath = Join-Path $directory 'gabito-full.tar.gz.dpapi'
    if (Test-Path -LiteralPath $cipherPath) { throw 'Ya existe una copia cifrada en esta carpeta. Revisar su recibo antes de continuar.' }
    $downloaded = 0
    if (Test-Path -LiteralPath $plainPath) {
        $partial = Get-Item -LiteralPath $plainPath
        if ($partial.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'La copia parcial es un enlace.' }
        $downloaded = $partial.Length
    }
    if ($downloaded -gt $report.bytes) { throw 'La copia parcial supera el tamano esperado. No se modificara.' }
    Write-Host ('Descargado: {0:N1} de {1:N1} MiB. Reanudacion por SFTP.' -f ($downloaded/1MB),($report.bytes/1MB))
    Write-Host 'No detiene ni modifica Gabito. Se conserva el avance si vuelve a cortarse.'
    Write-Host 'Ingresa la contrasena de la Philco aqui. No la compartas por chat.'
    if ($downloaded -lt $report.bytes) { Invoke-SftpResume $directory $report.archive ($UserName + '@' + $HostName) }
    if ((Get-Item -LiteralPath $plainPath).Length -ne $report.bytes) { throw 'El tamano descargado no coincide con el informe.' }
    Protect-VerifiedArchive $plainPath $cipherPath $report.sha256
    # Delete only the generated temporary copy after verifying the encrypted one.
    $expectedParent = [IO.Path]::GetFullPath($directory) + [IO.Path]::DirectorySeparatorChar
    if (![IO.Path]::GetFullPath($plainPath).StartsWith($expectedParent, [StringComparison]::OrdinalIgnoreCase)) { throw 'Ruta temporal fuera de la carpeta prevista.' }
    Remove-Item -LiteralPath $plainPath
    $receipt = [ordered]@{schema=1;kind='encrypted-backup-transfer';success=$true;verified=$true;sha256=$report.sha256;bytes=$report.bytes;encrypted_path=$cipherPath;protection='Windows-DPAPI-CurrentUser';plaintext_removed=$true;source_archive=$report.archive;restored=$false}
    $receiptPath = Join-Path $migration ('philco-transfer-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
    [IO.File]::WriteAllText($receiptPath, ($receipt | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
    Write-Host 'COPIA LOCAL CIFRADA Y VERIFICADA.'
    Write-Host "Informe: $receiptPath"
    Write-Host 'La copia cifrada depende de este usuario de Windows. El original sigue en la Philco.'
    Write-Host 'Todavia no se restauro ni se activaron canales en esta PC.'
    } finally { $lock.Dispose() }
}

if ($MyInvocation.InvocationName -ne '.') { Invoke-BackupTransfer }
