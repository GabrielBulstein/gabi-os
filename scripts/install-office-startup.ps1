param([switch]$Remove)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'windows-paths.ps1')
$paths=Get-GabiOsPaths
$taskName='GABI OS - Pixel Office'
$key='HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$valueName='GabiOsPixelOffice'
$supervisor=Join-Path $PSScriptRoot 'office-supervisor.ps1'
$powerShell=Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$arguments='-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "'+$supervisor+'"'
$runDir=Join-Path $paths.Base 'data\run'
[IO.Directory]::CreateDirectory($runDir)|Out-Null
$existing=Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if($existing -and !(@($existing.Actions)|Where-Object Arguments -Like '*office-supervisor.ps1*')){throw 'El nombre de tarea ya pertenece a otra configuracion.'}
if($Remove){
 if($existing){Unregister-ScheduledTask -TaskName $taskName -Confirm:$false}
 $current=(Get-ItemProperty -LiteralPath $key -Name $valueName -ErrorAction SilentlyContinue).$valueName
 if($current -and $current.Contains($supervisor)){Remove-ItemProperty -LiteralPath $key -Name $valueName}
 @{enabled=$false;at=[DateTime]::UtcNow.ToString('o')}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $runDir 'autostart.json') -Encoding UTF8
 Write-Output 'Inicio automatico desactivado. Los servicios que ya funcionan siguen encendidos.'
 exit 0
}
if(!(Test-Path -LiteralPath $supervisor)){throw 'Falta office-supervisor.ps1'}
$identity=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$method='scheduled-task'
try{
 $action=New-ScheduledTaskAction -Execute $powerShell -Argument $arguments -WorkingDirectory (Join-Path $paths.Base 'project\gabi-os')
 $trigger=New-ScheduledTaskTrigger -AtLogOn -User $identity
 $principal=New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
 $settings=New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
 Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Oficina, chat y gateway locales de GABI OS en D:, sin duplicar procesos.' -Force|Out-Null
}catch{
 if($existing){throw}
 # HKCU Run is the per-user fallback; no administrator or stored password.
 $method='user-logon'
 if(!(Test-Path -LiteralPath $key)){New-Item -Path $key -Force|Out-Null}
 $prior=(Get-ItemProperty -LiteralPath $key -Name $valueName -ErrorAction SilentlyContinue).$valueName
 if($prior -and !$prior.Contains($supervisor)){throw 'La entrada de inicio ya pertenece a otro programa.'}
 New-ItemProperty -LiteralPath $key -Name $valueName -Value ('"'+$powerShell+'" '+$arguments) -PropertyType String -Force|Out-Null
}
@{enabled=$true;method=$method;at=[DateTime]::UtcNow.ToString('o');script=$supervisor}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $runDir 'autostart.json') -Encoding UTF8
if($method -eq 'scheduled-task'){Start-ScheduledTask -TaskName $taskName}
else{Start-Process -FilePath $powerShell -ArgumentList $arguments -WorkingDirectory (Join-Path $paths.Base 'project\gabi-os') -WindowStyle Hidden|Out-Null}
Write-Output ("Inicio automatico activo: "+$method+". Registros y estado en D:\GABI-OS\data.")
