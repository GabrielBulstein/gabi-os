param(
    [ValidatePattern('^[a-zA-Z0-9][a-zA-Z0-9.-]*$')][string]$HostName = '192.168.1.10',
    [ValidatePattern('^[a-z_][a-z0-9_-]*$')][string]$UserName = 'gabriel'
)
$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot 'inventory-openclaw.py'
$payload = [Convert]::ToBase64String([IO.File]::ReadAllBytes($source))
$remoteCommand = "printf %s $payload | base64 -d | python3 -B"
Write-Host 'Inventario de solo lectura. No detiene Gabito ni lee el contenido de tus recuerdos en pantalla.'
Write-Host 'Si SSH solicita la contrasena, ingresala aqui. No la compartas por chat.'
$raw = & ssh.exe -o StrictHostKeyChecking=yes -o ConnectTimeout=7 -o NumberOfPasswordPrompts=1 "$UserName@$HostName" $remoteCommand
if ($LASTEXITCODE -ne 0) { throw 'No se completo el inventario SSH. No se cambio la Philco.' }
$report = ($raw -join "`n") | ConvertFrom-Json
if ($report.schema -ne 1 -or !$report.read_only) { throw 'Respuesta de inventario no valida.' }
$folder = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'GabiOS\migration'
New-Item -ItemType Directory -Path $folder -Force | Out-Null
$destination = Join-Path $folder ("philco-inventory-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
[IO.File]::WriteAllText($destination, ($raw -join "`n"), [Text.UTF8Encoding]::new($false))
Write-Host "Inventario guardado en: $destination"
Write-Host "Servicio: $($report.service) | Configuracion: $($report.config_status)"
Write-Host 'Este archivo es un inventario, no un respaldo. Aun no se migro ningun dato.'
