param(
    [ValidatePattern('^[a-zA-Z0-9][a-zA-Z0-9.-]*$')][string]$HostName = '192.168.1.10',
    [ValidatePattern('^[a-z_][a-z0-9_-]*$')][string]$UserName = 'gabriel'
)
$ErrorActionPreference = 'Stop'
$payload = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $PSScriptRoot 'backup-openclaw.py')))
$remoteCommand = "printf %s $payload | base64 -d | python3 -B"
Write-Host 'Respaldo completo y verificado de Gabito en una carpeta privada de la Philco.'
Write-Host 'Gabito tendra una pausa durante la copia. Se intentara reiniciarlo incluso si falla.'
Write-Host 'No se borra el original ni se restaura sobre esta PC. Ingresa la contrasena SSH aqui.'
$raw = & ssh.exe -o StrictHostKeyChecking=yes -o ConnectTimeout=7 -o NumberOfPasswordPrompts=1 -o ServerAliveInterval=15 -o ServerAliveCountMax=6 "$UserName@$HostName" $remoteCommand
if ($LASTEXITCODE -ne 0) { throw 'SSH se interrumpio. No relances el respaldo a ciegas: el trabajo remoto puede seguir activo.' }
$report = ($raw -join "`n") | ConvertFrom-Json
if ($report.schema -ne 1 -or $report.kind -ne 'source-backup') { throw 'Respuesta inesperada. Revisar el trabajo remoto.' }
$folder = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'GabiOS\migration'
New-Item -ItemType Directory -Path $folder -Force | Out-Null
$destination = Join-Path $folder ("philco-backup-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
[IO.File]::WriteAllText($destination, ($raw -join "`n"), [Text.UTF8Encoding]::new($false))
Write-Host "Informe guardado en: $destination"
if ($report.success) {
    Write-Host "RESPALDO VERIFICADO. Servicio de Gabito: $($report.service_after)"
    Write-Host "Archivo remoto: $($report.archive)"
    Write-Host "SHA-256: $($report.sha256)"
    Write-Host 'Todavia falta transferirlo de forma protegida y probar la restauracion.'
} else {
    Write-Host "NO SE CONFIRMO EL RESPALDO. Motivo: $($report.error)"
    Write-Host "Servicio de Gabito: $($report.service_after)"
    Write-Host 'Conserva este informe. No se borro ni se restauro el original.'
}
