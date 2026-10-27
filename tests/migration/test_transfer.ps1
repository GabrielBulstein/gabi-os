$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '..\..\scripts\fetch-philco-backup.ps1')
function Set-Acl { throw 'Simulated unavailable Security module. This test must not call Set-Acl.' }
$root = Join-Path ([IO.Path]::GetTempPath()) ('gabi-transfer-test-' + [guid]::NewGuid().ToString('N'))
New-PrivateBackupDirectory $root
$plain = Join-Path $root 'sample.bin'
$cipher = Join-Path $root 'sample.dpapi'
try {
    $caught = $false
    try { New-PrivateBackupDirectory $root } catch { $caught = $true }
    if (!$caught) { throw 'Se acepto una carpeta preexistente para cambiar sus permisos.' }
    [IO.File]::WriteAllBytes($plain, [Text.Encoding]::UTF8.GetBytes('FICTITIOUS_BACKUP_FOR_TEST_ONLY'))
    if ($PSVersionTable.PSEdition -eq 'Desktop') { $fileAcl = ([IO.FileInfo]::new($plain)).GetAccessControl() }
    else { $fileAcl = [IO.FileSystemAclExtensions]::GetAccessControl([IO.FileInfo]::new($plain)) }
    $allowed = @([Security.Principal.WindowsIdentity]::GetCurrent().User.Value, 'S-1-5-18')
    $fileRules = @($fileAcl.GetAccessRules($true, $true, [Security.Principal.SecurityIdentifier]))
    if ($fileRules.Count -ne 2 -or @($fileRules | Where-Object {$_.IdentityReference.Value -notin $allowed}).Count) { throw 'El archivo no heredo los permisos privados.' }
    $hash = (Get-FileHash -LiteralPath $plain -Algorithm SHA256).Hash.ToLowerInvariant()
    Protect-VerifiedArchive $plain $cipher $hash
    if (!(Test-Path -LiteralPath $cipher)) { throw 'No se genero la copia cifrada.' }
    if ((Get-FileHash -LiteralPath $cipher -Algorithm SHA256).Hash.ToLowerInvariant() -eq $hash) { throw 'La salida no esta cifrada.' }
    $caught = $false
    try { Protect-VerifiedArchive $plain (Join-Path $root 'must-not-exist.dpapi') ('0' * 64) } catch { $caught = $true }
    if (!$caught -or (Test-Path -LiteralPath (Join-Path $root 'must-not-exist.dpapi'))) { throw 'Se acepto una huella incorrecta.' }
    $caught = $false
    try { Assert-VerifiedBackupReport ([pscustomobject]@{schema=1;kind='source-backup';success=$false;verified=$false}) 'gabriel' } catch { $caught = $true }
    if (!$caught) { throw 'Se acepto un respaldo sin verificar.' }
    $caught = $false
    try { Assert-VerifiedBackupReport ([pscustomobject]@{schema=1;kind='source-backup';success=$true;verified=$true;archive='/etc/shadow';sha256=$hash;bytes=32}) 'gabriel' } catch { $caught = $true }
    if (!$caught) { throw 'Se acepto una ruta fuera del respaldo.' }
    $script:RemoteBytes = [byte[]]::new(65536)
    [Random]::new(42).NextBytes($script:RemoteBytes)
    $resumePath = Join-Path $root 'gabito-full.tar.gz.partial'
    [IO.File]::WriteAllBytes($resumePath, [byte[]]$script:RemoteBytes[0..16383])
    $sha = [Security.Cryptography.SHA256]::Create()
    try { $resumeHash = ([BitConverter]::ToString($sha.ComputeHash($script:RemoteBytes))).Replace('-','').ToLowerInvariant() } finally { $sha.Dispose() }
    $report = [pscustomobject]@{schema=1;kind='source-backup';success=$true;verified=$true;archive='/home/gabriel/Backups/GabiOS/20261027T181012Z-b3454e13/gabito-full.tar.gz';sha256=$resumeHash;bytes=$script:RemoteBytes.Length}
    Set-TransferIdentity $root $report
    $wrong = [pscustomobject]@{archive=$report.archive;sha256=('0'*64);bytes=$report.bytes}
    $caught = $false
    try { Set-TransferIdentity $root $wrong } catch { $caught = $true }
    if (!$caught) { throw 'Se acepto reanudar un respaldo distinto.' }
    $injected = [pscustomobject]@{schema=1;kind='source-backup';success=$true;verified=$true;archive=($report.archive+"`nbye");sha256=$resumeHash;bytes=$report.bytes}
    $caught = $false
    try { Assert-VerifiedBackupReport $injected 'gabriel' } catch { $caught = $true }
    if (!$caught) { throw 'Se acepto una ruta con salto de linea.' }
    $script:SimulateCut = $true
    function sftp.exe {
        begin { $script:SftpArgs = @($args); $script:SftpLines = @() }
        process { $script:SftpLines += $_ }
        end {
            $destination = Join-Path $PWD 'gabito-full.tar.gz.partial'
            $offset = [int](Get-Item -LiteralPath $destination).Length
            $count = $script:RemoteBytes.Length - $offset
            if ($script:SimulateCut) { $count = [Math]::Min(8192, $count) }
            $stream = [IO.File]::Open($destination, [IO.FileMode]::Append)
            try { $stream.Write($script:RemoteBytes, $offset, $count) } finally { $stream.Dispose() }
            if ($script:SimulateCut) { $global:LASTEXITCODE = 1 } else { $global:LASTEXITCODE = 0 }
        }
    }
    $caught = $false
    try { Invoke-SftpResume $root $report.archive 'test@127.0.0.1' } catch { $caught = $true }
    if (!$caught -or (Get-Item -LiteralPath $resumePath).Length -ne 24576) { throw 'No se conservo el avance tras un corte simulado.' }
    $script:SimulateCut = $false
    Invoke-SftpResume $root $report.archive 'test@127.0.0.1'
    if ((Get-FileHash -LiteralPath $resumePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $resumeHash) { throw 'La copia reanudada no coincide con el original ficticio.' }
    if ($script:SftpLines.Count -ne 2 -or $script:SftpLines[0] -ne "reget $($report.archive) gabito-full.tar.gz.partial" -or $script:SftpLines[1] -ne 'bye') { throw 'Comandos de descarga inesperados.' }
    if ([array]::IndexOf($script:SftpArgs,'BatchMode=no') -gt [array]::IndexOf($script:SftpArgs,'-b')) { throw 'El orden de opciones impide la autenticacion interactiva.' }
    Write-Output 'OK: ACL privada, cifrado, validacion de origen, rechazo de inyeccion, corte simulado y reanudacion sin perder bytes.'
} finally {
    foreach ($file in @($plain, $cipher, (Join-Path $root 'must-not-exist.dpapi'), (Join-Path $root 'gabito-full.tar.gz.partial'), (Join-Path $root 'transfer-source.json'))) { if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file } }
    Remove-Item -LiteralPath $root
}
