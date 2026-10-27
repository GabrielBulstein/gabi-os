param(
    [string]$ReportPath,
    [ValidatePattern('^[a-zA-Z0-9][a-zA-Z0-9.-]*$')][string]$HostName = '192.168.1.10',
    [ValidatePattern('^[a-z_][a-z0-9_-]*$')][string]$UserName = 'gabriel'
)
$ErrorActionPreference = 'Stop'

function Assert-VerifiedBackupReport($Report, [string]$SourceUser) {
    if ($Report.schema -ne 1 -or $Report.kind -ne 'source-backup' -or $Report.success -ne $true -or $Report.verified -ne $true) {
        throw 'El informe no confirma un respaldo verificado. No se iniciara la transferencia.'
    }
    $pattern = '^/home/' + [regex]::Escape($SourceUser) + '/Backups/GabiOS/[0-9]{8}T[0-9]{6}Z-[0-9a-f]{8}/gabito-full\.tar\.gz$'
    if ($Report.archive -notmatch $pattern -or $Report.sha256 -notmatch '^[0-9a-f]{64}$') {
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

function Invoke-BackupTransfer {
    $migration = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'GabiOS\migration'
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
    $directory = Join-Path $backupRoot ((Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0,8))
    New-Item -ItemType Directory -Path $directory | Out-Null
    $acl = New-Object Security.AccessControl.DirectorySecurity
    $acl.SetAccessRuleProtection($true, $false)
    $inherit = [Security.AccessControl.InheritanceFlags]'ContainerInherit,ObjectInherit'
    foreach ($sid in @([Security.Principal.WindowsIdentity]::GetCurrent().User, [Security.Principal.SecurityIdentifier]::new('S-1-5-18'))) {
        $rule = [Security.AccessControl.FileSystemAccessRule]::new($sid, [Security.AccessControl.FileSystemRights]::FullControl, $inherit, [Security.AccessControl.PropagationFlags]::None, [Security.AccessControl.AccessControlType]::Allow)
        $acl.AddAccessRule($rule)
    }
    Set-Acl -LiteralPath $directory -AclObject $acl
    $plainPath = Join-Path $directory 'gabito-full.tar.gz.partial'
    $cipherPath = Join-Path $directory 'gabito-full.tar.gz.dpapi'
    Write-Host 'Copia por SSH a una carpeta privada de esta PC. No detiene ni modifica Gabito.'
    Write-Host 'Ingresa la contrasena de la Philco aqui. No la compartas por chat.'
    $source = $UserName + '@' + $HostName + ':' + $report.archive
    & scp.exe -o StrictHostKeyChecking=yes -o ConnectTimeout=7 -o NumberOfPasswordPrompts=1 $source $plainPath
    if ($LASTEXITCODE -ne 0) { throw "Transferencia interrumpida. La copia parcial sigue privada en $directory" }
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
}

if ($MyInvocation.InvocationName -ne '.') { Invoke-BackupTransfer }
