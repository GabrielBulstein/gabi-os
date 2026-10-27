$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '..\..\scripts\fetch-philco-backup.ps1')
$root = Join-Path ([IO.Path]::GetTempPath()) ('gabi-transfer-test-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $root | Out-Null
$plain = Join-Path $root 'sample.bin'
$cipher = Join-Path $root 'sample.dpapi'
try {
    [IO.File]::WriteAllBytes($plain, [Text.Encoding]::UTF8.GetBytes('FICTITIOUS_BACKUP_FOR_TEST_ONLY'))
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
    Write-Output 'OK: cifrado/descifrado real, rechazo de huella incorrecta, informe no verificado y ruta ajena.'
} finally {
    foreach ($file in @($plain, $cipher, (Join-Path $root 'must-not-exist.dpapi'))) { if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file } }
    Remove-Item -LiteralPath $root
}
