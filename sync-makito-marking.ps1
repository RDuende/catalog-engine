param(
  [string]$BaseUrl = "http://127.0.0.1:3000/api/v1"
)

$ErrorActionPreference = "Stop"

$Uri = "$BaseUrl/marking-intelligence/providers/makito/sync"

Write-Host "POST $Uri"

try {
  $result = Invoke-RestMethod `
    -Method Post `
    -Uri $Uri `
    -ContentType "application/json" `
    -Body "{}"

  $result | ConvertTo-Json -Depth 20
}
catch {
  Write-Host ""
  Write-Host "ERROR EN SINCRONIZACION"
  Write-Host $_.Exception.Message
  throw
}
