$ErrorActionPreference='Stop'
$base='D:\GABI-OS'
$trial=Get-Content -Raw -LiteralPath 'D:\GABI-OS\data\recovery\20261027-155259-f2a2724d\validation.json' | ConvertFrom-Json
if(!$trial.sqliteInventoryVerified -or $trial.failures.Count -or $trial.workspaceFilesMatched -ne 129 -or $trial.dailyMemoryFilesMatched -ne 38){throw 'El ensayo no esta validado.'}
$status=Invoke-RestMethod 'http://127.0.0.1:8787/status'
if($status.gateway -ne 'live'){throw 'El gateway de D no responde.'}
$sourceData='C:\Users\gabri\AppData\Local\GabiOS'
$snapshot='D:\GABI-OS\data\snapshots\migration-before-D'
& robocopy.exe (Join-Path $sourceData 'migration') $snapshot /E /XJ /R:1 /W:1 /COPY:DAT /DCOPY:DAT /NP /NFL /NDL /NJH /NJS | Out-Null
if($LASTEXITCODE -ge 8){throw 'Fallo el snapshot final de migracion.'}
& node.exe (Join-Path $PSScriptRoot 'verify-copied-tree.mjs') (Join-Path $sourceData 'migration') $snapshot 'D:\GABI-OS\data\move-audit\migration-original-snapshot.json'
if($LASTEXITCODE -ne 0){throw 'No coincide el snapshot de migracion.'}
foreach($name in @('project-original-snapshot','runtime-original-snapshot','migration-original-snapshot')){
 $audit=Get-Content -Raw -LiteralPath (Join-Path $base "data\move-audit\$name.json") | ConvertFrom-Json
 if(!$audit.verified){throw "Snapshot no verificado: $name"}
}
$items=@(
 [pscustomobject]@{Source='C:\Users\gabri\OneDrive\DESCARGAS\Proyecto The Office\gabi-os';Target='D:\GABI-OS\project\gabi-os';Retired='C:\Users\gabri\OneDrive\DESCARGAS\Proyecto The Office\gabi-os.pre-D-20261027'},
 [pscustomobject]@{Source='C:\Users\gabri\OneDrive\DESCARGAS\Proyecto The Office\publication';Target='D:\GABI-OS\project\publication';Retired='C:\Users\gabri\OneDrive\DESCARGAS\Proyecto The Office\publication.pre-D-20261027'},
 [pscustomobject]@{Source=$sourceData;Target='D:\GABI-OS\data';Retired='C:\Users\gabri\AppData\Local\GabiOS.pre-D-20261027'}
)
foreach($item in $items){
 if([IO.Path]::GetFullPath($item.Source) -ne $item.Source -or [IO.Path]::GetFullPath($item.Retired) -ne $item.Retired){throw 'Ruta inesperada.'}
 if((Get-Item -LiteralPath $item.Source).LinkType){throw 'El origen ya es un enlace; revisar antes de repetir.'}
 if(Test-Path -LiteralPath $item.Retired){throw 'Ya existe un origen retirado. No se sobrescribira.'}
 if(!(Test-Path -LiteralPath $item.Target)){throw 'No existe el destino de D.'}
}
foreach($item in $items){
 Rename-Item -LiteralPath $item.Source -NewName ([IO.Path]::GetFileName($item.Retired)) -Force
 try{
  New-Item -ItemType Junction -Path $item.Source -Target $item.Target | Out-Null
  $alias=Get-Item -LiteralPath $item.Source
  if($alias.LinkType -ne 'Junction' -or @($alias.Target)[0] -ne $item.Target){throw 'No se confirmo el acceso de compatibilidad.'}
 }catch{
  if(!(Test-Path -LiteralPath $item.Source)){Rename-Item -LiteralPath $item.Retired -NewName ([IO.Path]::GetFileName($item.Source)) -Force}
  throw
 }
}
$receipt=[ordered]@{schema=1;project='D:\GABI-OS\project\gabi-os';data='D:\GABI-OS\data';snapshotsVerified=$true;legacyPathsAreJunctions=$true;oldPhysicalCopiesRemoved=$false;retainedCopies=@($items.Retired);restoredInStaging=$true;sourceProfileActivated=$false}
[IO.File]::WriteAllText('D:\GABI-OS\data\move-audit\completed.json',($receipt|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
Write-Output 'RUTAS ACTIVAS EN D. Se conservan las copias anteriores de C, pendientes de autorizacion de limpieza.'
