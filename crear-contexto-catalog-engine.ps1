param(
    [string]$ProjectPath = "C:\catalog-engine",
    [string]$OutputZip = "$env:USERPROFILE\Desktop\catalog-engine-context.zip"
)

$ErrorActionPreference = "Stop"

$ProjectPath = (Resolve-Path $ProjectPath).Path
$TempPath = Join-Path $env:TEMP ("catalog-engine-context-" + [guid]::NewGuid().ToString("N"))

$items = @(
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "prisma.config.ts",
    ".env.example",
    ".gitignore",

    "prisma",
    "src",
    "docs",
    "knowledge",
    "scripts",
    "tests",

    "VERSION",
    "CHANGELOG.md",
    "README.md"
)

New-Item -ItemType Directory -Path $TempPath -Force | Out-Null

try {
    foreach ($item in $items) {
        $source = Join-Path $ProjectPath $item

        if (-not (Test-Path $source)) {
            Write-Host "Omitido (no existe): $item" -ForegroundColor DarkYellow
            continue
        }

        $destination = Join-Path $TempPath $item
        $destinationParent = Split-Path $destination -Parent

        New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
        Copy-Item -Path $source -Destination $destination -Recurse -Force

        Write-Host "Incluido: $item" -ForegroundColor Green
    }

    if (Test-Path $OutputZip) {
        Remove-Item $OutputZip -Force
    }

    Compress-Archive -Path (Join-Path $TempPath "*") -DestinationPath $OutputZip -CompressionLevel Optimal

    $sizeMb = [math]::Round((Get-Item $OutputZip).Length / 1MB, 2)

    Write-Host ""
    Write-Host "ZIP creado correctamente:" -ForegroundColor Cyan
    Write-Host $OutputZip
    Write-Host "Tamaño: $sizeMb MB"
}
finally {
    if (Test-Path $TempPath) {
        Remove-Item $TempPath -Recurse -Force
    }
}
