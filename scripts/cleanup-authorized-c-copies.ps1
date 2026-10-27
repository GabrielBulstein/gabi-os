$ErrorActionPreference='Stop'
$receiptPath='D:\GABI-OS\data\move-audit\completed.json'
$receipt=Get-Content -Raw -LiteralPath $receiptPath | ConvertFrom-Json
if($receipt.oldPhysicalCopiesRemoved){Write-Output 'La limpieza ya estaba completada.'; exit 0}
$directories=@(
 'C:\Users\gabri\OneDrive\DESCARGAS\Proyecto The Office\gabi-os.pre-D-20261027',
 'C:\Users\gabri\OneDrive\DESCARGAS\Proyecto The Office\publication.pre-D-20261027',
 'C:\Users\gabri\AppData\Local\GabiOS.pre-D-20261027'
)
$documents=@(
 'C:\Users\gabri\OneDrive\DESCARGAS\Proyecto The Office\GABI_OS_Documento_Maestro_v1.0.md',
 'C:\Users\gabri\OneDrive\DESCARGAS\Proyecto The Office\PROMPT_MAESTRO_PARA_CODEX.md'
)
if((Compare-Object $directories @($receipt.retainedCopies)) -or (Compare-Object $documents @($receipt.retainedDocuments))){throw 'La lista no coincide con las cinco copias autorizadas.'}
foreach($name in @('cleanup-project','cleanup-publication','cleanup-runtime','cleanup-migration')){
 $audit=Get-Content -Raw -LiteralPath ("D:\GABI-OS\data\move-audit\"+$name+'.json') | ConvertFrom-Json
 if(!$audit.verified){throw "No esta verificado el respaldo: $name"}
}
foreach($document in $documents){
 $destination=Join-Path 'D:\GABI-OS\project' ([IO.Path]::GetFileName($document))
 if((Get-FileHash -LiteralPath $document -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash){throw 'Un documento ya no coincide con su copia de D.'}
}
foreach($directory in $directories){
 $resolved=(Resolve-Path -LiteralPath $directory).ProviderPath
 if(![string]::Equals($resolved,[IO.Path]::GetFullPath($directory),[StringComparison]::OrdinalIgnoreCase)){throw 'El destino no es la ruta absoluta esperada.'}
 $item=Get-Item -LiteralPath $directory
 if(!$item.PSIsContainer -or $item.LinkType){throw 'Una copia antigua es un enlace o cambio de tipo.'}
}
$before=(Get-PSDrive C).Free
$globalPackage='C:\Users\gabri\AppData\Roaming\npm\node_modules\openclaw\package.json'
$globalHash=(Get-FileHash -LiteralPath $globalPackage -Algorithm SHA256).Hash
$removed=@()
foreach($directory in $directories){
 $prefix=[IO.Path]::GetFullPath($directory)+'\'
 # Remove link entries only, without recursion, before deleting their old parent.
 # This preserves the shared OpenClaw package referenced by a managed cache link.
 $links=@(Get-ChildItem -LiteralPath $directory -Recurse -Force -Attributes ReparsePoint | Where-Object {$_.LinkType -in 'Junction','SymbolicLink'})
 foreach($link in $links){
  if(![IO.Path]::GetFullPath($link.FullName).StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)){throw 'Enlace fuera del destino autorizado.'}
  Remove-Item -LiteralPath $link.FullName -Force -Confirm:$false
 }
 $done=$false
 for($attempt=1;$attempt -le 3;$attempt++){
  try{
   if((Get-Item -LiteralPath $directory).LinkType){throw 'La copia cambio a enlace antes de borrarla.'}
   if([IO.Path]::GetFullPath($directory) -notin $directories){throw 'Ruta fuera de las tres carpetas autorizadas.'}
   Remove-Item -LiteralPath $directory -Recurse -Force -Confirm:$false
   $done=$true
   break
  }catch{if($attempt -eq 3){throw};Start-Sleep -Seconds 2}
 }
 if(!$done -or (Test-Path -LiteralPath $directory)){throw 'No se completo la limpieza de una carpeta.'}
 $removed+=$directory
}
foreach($document in $documents){
 if([IO.Path]::GetFullPath($document) -notin $documents -or (Get-Item -LiteralPath $document).LinkType){throw 'Documento fuera de las dos rutas autorizadas.'}
 Remove-Item -LiteralPath $document -Force -Confirm:$false
 $removed+=$document
}
if((Get-FileHash -LiteralPath $globalPackage -Algorithm SHA256).Hash -ne $globalHash){throw 'Cambio inesperado en el paquete compartido; revisar.'}
$receipt.oldPhysicalCopiesRemoved=$true
$receipt.cleanupNeedsExplicitApproval=$false
$receipt | Add-Member -NotePropertyName removedCopies -NotePropertyValue $removed -Force
$receipt | Add-Member -NotePropertyName cleanupAuthorizedByUser -NotePropertyValue $true -Force
$receipt | Add-Member -NotePropertyName freeBytesBefore -NotePropertyValue $before -Force
$receipt | Add-Member -NotePropertyName freeBytesAfter -NotePropertyValue (Get-PSDrive C).Free -Force
[IO.File]::WriteAllText($receiptPath,($receipt|ConvertTo-Json -Depth 6),[Text.UTF8Encoding]::new($false))
[pscustomobject]@{Removed=$removed.Count;FreedGiB=[math]::Round(($receipt.freeBytesAfter-$before)/1GB,2);CFreeGiB=[math]::Round($receipt.freeBytesAfter/1GB,2)} | ConvertTo-Json -Compress
