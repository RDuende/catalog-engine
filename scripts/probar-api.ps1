$base = "http://127.0.0.1:3000"

Write-Host "Health:" -ForegroundColor Cyan
Invoke-RestMethod "$base/health" | ConvertTo-Json -Depth 5

Write-Host "`nProductos:" -ForegroundColor Cyan
Invoke-RestMethod "$base/api/v1/products" | ConvertTo-Json -Depth 8

Write-Host "`nCategorías:" -ForegroundColor Cyan
Invoke-RestMethod "$base/api/v1/categories" | ConvertTo-Json -Depth 8
