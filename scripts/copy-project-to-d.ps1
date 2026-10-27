$ErrorActionPreference='Stop'
$sourceProject='C:\Users\gabri\OneDrive\DESCARGAS\Proyecto The Office'
$sourceData='C:\Users\gabri\AppData\Local\GabiOS'
$base='D:\GABI-OS'
if([IO.Path]::GetFullPath($base) -ne 'D:\GABI-OS'){throw 'Destino inesperado.'}
if(Test-Path -LiteralPath $base){throw 'D:\GABI-OS ya existe; revisar antes de copiar.'}
. (Join-Path $PSScriptRoot 'fetch-philco-backup.ps1')
New-PrivateBackupDirectory $base
$project=Join-Path $base 'project'
$data=Join-Path $base 'data'
foreach($directory in @($project,$data,(Join-Path $base 'cache\tmp'),(Join-Path $base 'cache\npm'))){[IO.Directory]::CreateDirectory($directory) | Out-Null}
function Copy-CheckedTree([string]$Source,[string]$Destination,[string]$Name,[string]$Exclude=''){
    $options=@('/E','/XJ','/R:1','/W:1','/COPY:DAT','/DCOPY:DAT','/NP','/NFL','/NDL','/NJH','/NJS')
    if($Exclude){$options+=@('/XD');$options+=$Exclude.Split(',')}
    & robocopy.exe $Source $Destination @options | Out-Null
    if($LASTEXITCODE -ge 8){throw "Fallo la copia de $Name. No se borro el origen."}
    & node.exe (Join-Path $PSScriptRoot 'verify-copied-tree.mjs') $Source $Destination (Join-Path $data "move-audit\$Name.json") $Exclude
    if($LASTEXITCODE -ne 0){throw "No coinciden las huellas de $Name. No se borro el origen."}
}
Copy-CheckedTree $sourceProject $project 'project' 'node_modules,dist,test-results,__pycache__'
Copy-CheckedTree (Join-Path $sourceData 'runtime') (Join-Path $data 'runtime') 'runtime'
Copy-CheckedTree (Join-Path $sourceData 'migration') (Join-Path $data 'migration') 'migration'
Copy-CheckedTree (Join-Path $sourceData 'runtime') (Join-Path $data 'snapshots\pc-before-D\runtime') 'runtime-original-snapshot'
Write-Host 'COPIAS EN D VERIFICADAS. Los origenes de C siguen intactos; no reanudar procesos desde C.'
