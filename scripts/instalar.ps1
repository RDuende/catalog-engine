$ErrorActionPreference = "Stop"

Write-Host "=== La Colorida Catalog Engine v0.6.0 ===" -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host "Se ha creado .env desde .env.example." -ForegroundColor Yellow
    Write-Host "Edita DATABASE_URL antes de continuar." -ForegroundColor Yellow
    exit 0
}

npm install
npx prisma format
npx prisma validate
npx prisma generate

New-Item -ItemType Directory -Force -Path "storage/imports" | Out-Null
New-Item -ItemType Directory -Force -Path "storage/assets" | Out-Null

Write-Host ""
Write-Host "Instalación completada." -ForegroundColor Green
Write-Host "Ejecuta: npm run dev" -ForegroundColor Green
