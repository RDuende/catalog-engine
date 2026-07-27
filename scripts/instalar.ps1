$ErrorActionPreference = "Stop"

Write-Host "=== RecuerdArte Catalog Engine v0.30.0 ===" -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host "Se ha creado .env desde .env.example." -ForegroundColor Yellow
    Write-Host "Edita DATABASE_URL antes de continuar y vuelve a ejecutar este instalador." -ForegroundColor Yellow
    exit 0
}

Write-Host "Instalando dependencias..." -ForegroundColor Cyan
npm install

Write-Host "Validando Prisma..." -ForegroundColor Cyan
npx prisma format
npx prisma validate
npx prisma generate

Write-Host "Aplicando migraciones pendientes..." -ForegroundColor Cyan
npx prisma migrate deploy

Write-Host "Comprobando TypeScript..." -ForegroundColor Cyan
npm run typecheck
npm run build

New-Item -ItemType Directory -Force -Path "storage/imports" | Out-Null
New-Item -ItemType Directory -Force -Path "storage/assets" | Out-Null

Write-Host ""
Write-Host "Instalación v0.30.0 completada." -ForegroundColor Green
Write-Host "Ejecuta: npm run dev" -ForegroundColor Green
