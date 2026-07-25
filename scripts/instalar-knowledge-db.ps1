[CmdletBinding()]
param(
    [string]$ProjectPath = "C:\catalog-engine"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Fail([string]$message) {
    Write-Host ""
    Write-Host "ERROR: $message" -ForegroundColor Red
    exit 1
}

Set-Location $ProjectPath

$envFile = Join-Path $ProjectPath ".env"
if (-not (Test-Path $envFile)) {
    Fail "No existe $envFile"
}

$databaseLine = Get-Content $envFile |
    Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } |
    Select-Object -First 1

if (-not $databaseLine) {
    Fail "No se encontro DATABASE_URL en .env"
}

$databaseUrl = ($databaseLine -replace '^\s*DATABASE_URL\s*=\s*', '').Trim()

if (
    ($databaseUrl.StartsWith('"') -and $databaseUrl.EndsWith('"')) -or
    ($databaseUrl.StartsWith("'") -and $databaseUrl.EndsWith("'"))
) {
    $databaseUrl = $databaseUrl.Substring(1, $databaseUrl.Length - 2)
}

$databaseUrl = $databaseUrl -replace '([?&])schema=[^&]+&?', '$1'
$databaseUrl = $databaseUrl.TrimEnd('?', '&')
$databaseUrl = $databaseUrl -replace '\?&', '?'

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Fail "psql no esta disponible en PATH."
}

$sqlFile = Join-Path $ProjectPath "scripts\knowledge-engine.sql"
if (-not (Test-Path $sqlFile)) {
    Fail "No existe $sqlFile"
}

Write-Host "Instalando tablas del Knowledge Engine..." -ForegroundColor Cyan

& psql $databaseUrl -v ON_ERROR_STOP=1 -f $sqlFile

if ($LASTEXITCODE -ne 0) {
    Fail "La instalacion SQL ha fallado."
}

Write-Host ""
Write-Host "Knowledge Engine instalado correctamente." -ForegroundColor Green

