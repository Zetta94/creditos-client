$filePath = "c:\Users\PC\Desktop\Dashboard creditos\creditos-client\src\pages\CreditoNuevo.jsx"
$lines = Get-Content -Path $filePath -Encoding UTF8
$kept = $lines[0..1560]
Set-Content -Path $filePath -Value $kept -Encoding UTF8
Write-Host "Done. Total lines kept: $($kept.Count)"
