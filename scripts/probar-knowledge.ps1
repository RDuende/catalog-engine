$base = "http://127.0.0.1:3000/api/v1"

Write-Host "Nodos del grafo:" -ForegroundColor Cyan
Invoke-RestMethod "$base/knowledge/nodes" | ConvertTo-Json -Depth 8

Write-Host "`nRecomendación para cafetería:" -ForegroundColor Cyan
$body = @{
  query = "Voy a abrir una cafetería y necesito ideas para promocionarla"
  limit = 10
  depth = 3
} | ConvertTo-Json

$result = Invoke-RestMethod `
  -Uri "$base/knowledge/recommend" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body

$result | ConvertTo-Json -Depth 15

Write-Host "`nExplicación completa:" -ForegroundColor Cyan
Invoke-RestMethod "$base/knowledge/sessions/$($result.sessionId)" |
  ConvertTo-Json -Depth 15
