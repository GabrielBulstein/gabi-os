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
    Write-Output 'OK: carpeta privada sin Set-Acl, permisos heredados, cifrado/descifrado, rechazo de carpeta existente, huella incorrecta, informe no verificado y ruta ajena.'
} finally {
    foreach ($file in @($plain, $cipher, (Join-Path $root 'must-not-exist.dpapi'))) { if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file } }
    Remove-Item -LiteralPath $root
}
