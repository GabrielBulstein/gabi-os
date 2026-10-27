$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'fetch-philco-backup.ps1')
$paths=Get-GabiOsPaths
$env:TEMP=$paths.Temp; $env:TMP=$paths.Temp
$receiptPath=Get-ChildItem -LiteralPath $paths.Migration -Filter 'philco-transfer-*.json' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$receipt=Get-Content -Raw -LiteralPath $receiptPath.FullName | ConvertFrom-Json
if(!$receipt.success -or !$receipt.verified -or $receipt.sha256 -notmatch '^[0-9a-f]{64}\z'){throw 'No hay recibo verificado.'}
$expectedRoot=[IO.Path]::GetFullPath($paths.Migration)+'\'
if(![IO.Path]::GetFullPath($receipt.encrypted_path).StartsWith($expectedRoot,[StringComparison]::OrdinalIgnoreCase)){throw 'El archivo cifrado no esta bajo la ruta de datos de D:.'}
$parent=Join-Path $paths.Base 'data\recovery'
[IO.Directory]::CreateDirectory($parent) | Out-Null
$folder=Join-Path $parent ((Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+[guid]::NewGuid().ToString('N').Substring(0,8))
New-PrivateBackupDirectory $folder
Add-Type -AssemblyName System.Security
$bytes=$null
$hash=[Security.Cryptography.SHA256]::Create()
try{
 $bytes=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($receipt.encrypted_path),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
 $actual=([BitConverter]::ToString($hash.ComputeHash($bytes))).Replace('-','').ToLowerInvariant()
 if($actual -ne $receipt.sha256 -or $bytes.Length -ne $receipt.bytes){throw 'La copia descifrada no coincide con el respaldo.'}
 $archive=Join-Path $folder 'gabito-full.tar.gz'
 $stream=[IO.File]::Open($archive,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
 try{$stream.Write($bytes,0,$bytes.Length)}finally{$stream.Dispose()}
 $plan=[ordered]@{schema=1;archive=$archive;sha256=$actual;bytes=$bytes.Length;target=(Join-Path $folder 'restored');activated=$false}
 [IO.File]::WriteAllText((Join-Path $folder 'staging-plan.json'),($plan|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
 Write-Output ('STAGING_INPUT='+$folder)
}finally{if($null -ne $bytes){[Array]::Clear($bytes,0,$bytes.Length)};$hash.Dispose()}
