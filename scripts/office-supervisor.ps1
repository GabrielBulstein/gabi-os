param([switch]$Once)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'windows-paths.ps1')
$paths=Get-GabiOsPaths
$project=Join-Path $paths.Base 'project\gabi-os'
$run=Join-Path $paths.Base 'data\run'
$logs=Join-Path $paths.Base 'data\logs'
foreach($folder in @($run,$logs,$paths.Temp,$paths.NpmCache)){[IO.Directory]::CreateDirectory($folder)|Out-Null}
$env:GABI_OS_HOME=$paths.Base
$env:TEMP=$paths.Temp
$env:TMP=$paths.Temp
$env:NPM_CONFIG_CACHE=$paths.NpmCache
$env:NODE_COMPILE_CACHE=Join-Path $paths.Base 'cache\node'
$launch=Join-Path $PSScriptRoot 'start-office.ps1'
$powerShell=Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$mutex=New-Object Threading.Mutex($false,("Local\GabiOsPixelOffice-"+$sid))
$held=$false
try{
 try{$held=$mutex.WaitOne(0)}catch [Threading.AbandonedMutexException]{$held=$true}
 if(!$held){Write-Output 'El supervisor de GABI OS ya esta activo.';exit 0}
 $started=@{}
 $last=@{}
 $specs=@(@{Name='gateway';Port=18799},@{Name='server';Port=8787},@{Name='dev';Port=5173})
 if(Test-Path -LiteralPath (Join-Path $run 'private-access.json')){$specs+=@{Name='private:server';Port=8790}}
 function Test-OfficeOwner($processId,$kind){
  $process=Get-CimInstance Win32_Process -Filter ("ProcessId="+$processId) -ErrorAction SilentlyContinue
  if(!$process){return $false}
  $line=[string]$process.CommandLine
  if($kind -eq 'gateway'){return ($line.Contains((Join-Path $paths.Base 'tools\openclaw-2026.10.1')) -and $line -match 'gateway run' -and $line -match '18799')}
  if($kind -eq 'dev'){return ($line.Contains($project) -and $line -match 'vite[\\/]bin[\\/]vite.js')}
  if($kind -eq 'private:server'){if($line -notmatch 'server[\\/]private.mjs'){return $false}}elseif($line -notmatch 'server[\\/]desktop.mjs'){return $false}
  for($depth=0;$depth -lt 6 -and $process;$depth++){
   if(([string]$process.CommandLine).Contains($project)){return $true}
   $process=Get-CimInstance Win32_Process -Filter ("ProcessId="+$process.ParentProcessId) -ErrorAction SilentlyContinue
  }
  return $false
 }
 function Write-Event($name,$state,$processId){
  if($last[$name] -eq $state){return}
  $last[$name]=$state
  @{at=[DateTime]::UtcNow.ToString('o');service=$name;state=$state;processId=$processId}|ConvertTo-Json -Compress|Add-Content -LiteralPath (Join-Path $logs 'supervisor.jsonl') -Encoding UTF8
 }
 do{
  $statuses=@()
  foreach($spec in $specs){
   $name=$spec.Name
   $logName=$name.Replace(':','-')
   $listeners=@(Get-NetTCPConnection -State Listen -LocalPort $spec.Port -ErrorAction SilentlyContinue)
   $state='waiting';$ownerId=$null
   if($listeners.Count){
    $ownerId=$listeners[0].OwningProcess
    if(Test-OfficeOwner $ownerId $name){$state='listening'}else{$state='port-in-use-by-other-process'}
   }else{
    $entry=$started[$name]
    if($entry -and !(Get-Process -Id $entry.Id -ErrorAction SilentlyContinue)){$started.Remove($name);$entry=$null}
    if(!$entry){
     $stamp=[DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss-fff')
     $child=Start-Process -FilePath $powerShell -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',('"{0}"' -f $launch),$name) -WorkingDirectory $project -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logs "$logName-$stamp.out.log") -RedirectStandardError (Join-Path $logs "$logName-$stamp.err.log") -PassThru
     $started[$name]=@{Id=$child.Id;Since=[DateTime]::UtcNow}
     $state='starting';$ownerId=$child.Id
    }else{
     $ownerId=$entry.Id
     if(([DateTime]::UtcNow-$entry.Since).TotalSeconds -gt 150){$state='startup-slow'}else{$state='starting'}
    }
   }
   Write-Event $name $state $ownerId
   $statuses+=@{service=$name;port=$spec.Port;state=$state;processId=$ownerId}
  }
  $record=@{schema=1;checkedAt=[DateTime]::UtcNow.ToString('o');supervisorPid=$PID;services=$statuses}
  $temporary=Join-Path $run 'supervisor-status.pending'
  $record|ConvertTo-Json -Depth 4|Set-Content -LiteralPath $temporary -Encoding UTF8
  Move-Item -LiteralPath $temporary -Destination (Join-Path $run 'supervisor-status.json') -Force
  if(!$Once){Start-Sleep -Seconds 15}
 }while(!$Once)
}finally{
 if($held){$mutex.ReleaseMutex()}
 $mutex.Dispose()
}
