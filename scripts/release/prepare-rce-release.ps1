param(
  [string]$Branch = "feature/rce-runtime"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".git")) {
  throw "Este directorio no parece ser un repositorio Git."
}

$status = git status --porcelain
if ($LASTEXITCODE -ne 0) {
  throw "No se pudo consultar el estado de Git."
}

if ($status) {
  Write-Host ""
  Write-Host "El árbol de Git no está limpio."
  Write-Host ""
  Write-Host "Para seguir desarrollando usa:"
  Write-Host "  npm run release:rce:dev"
  Write-Host ""
  Write-Host "Para ver el estado completo usa:"
  Write-Host "  npm run release:rce:status"
  Write-Host ""
  throw "La preparación estricta de release requiere guardar o confirmar todos los cambios."
}

$current = git branch --show-current
if ($LASTEXITCODE -ne 0) {
  throw "No se pudo determinar la rama actual."
}

if ($current -ne $Branch) {
  $exists = git branch --list $Branch

  if ($exists) {
    git switch $Branch
  } else {
    git switch -c $Branch
  }

  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo crear o cambiar a la rama $Branch."
  }
}

Write-Host ""
Write-Host "Rama preparada: $Branch"
Write-Host "Ejecutando verificación estricta..."
Write-Host ""

powershell -ExecutionPolicy Bypass -File "scripts/release/verify-rce-release.ps1"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "La rama está preparada para publicar una release RCE."
