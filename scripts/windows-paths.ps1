function Get-GabiOsPaths {
    $base = 'D:\GABI-OS'
    if ($env:GABI_OS_HOME) { $base = [IO.Path]::GetFullPath($env:GABI_OS_HOME) }
    if ([IO.Path]::GetPathRoot($base).ToUpperInvariant() -ne 'D:\') { throw 'Los datos de GABI OS deben alojarse en D:.' }
    [pscustomobject]@{Base=$base;Runtime=(Join-Path $base 'data\runtime');Migration=(Join-Path $base 'data\migration');Temp=(Join-Path $base 'cache\tmp');NpmCache=(Join-Path $base 'cache\npm')}
}
