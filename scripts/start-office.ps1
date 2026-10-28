param([ValidateSet('dev','preview','server','gateway','build','test','test:server','test:e2e','gateway:login','gateway:check','private:server','build:private')][string]$Task='dev')
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'windows-paths.ps1')
$paths=Get-GabiOsPaths
foreach($directory in @($paths.Temp,$paths.NpmCache)){[IO.Directory]::CreateDirectory($directory)|Out-Null}
$env:GABI_OS_HOME=$paths.Base
$env:TEMP=$paths.Temp
$env:TMP=$paths.Temp
$env:NPM_CONFIG_CACHE=$paths.NpmCache
$env:NODE_COMPILE_CACHE=Join-Path $paths.Base 'cache\node'
Set-Location -LiteralPath (Join-Path $paths.Base 'project\gabi-os')
& npm.cmd run $Task
exit $LASTEXITCODE
