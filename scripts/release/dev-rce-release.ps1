$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== RCE DEVELOPMENT CHECK ==="
Write-Host ""

$branch = git branch --show-current
if ($LASTEXITCODE -eq 0) {
  Write-Host "Branch: $branch"
}

$status = git status --porcelain
if ($LASTEXITCODE -eq 0) {
  $modified = @($status | Where-Object { $_ -match "^[ MARC][MD]" }).Count
  $untracked = @($status | Where-Object { $_ -match "^\?\?" }).Count

  Write-Host "Modified: $modified"
  Write-Host "Untracked: $untracked"
  Write-Host ""
}

Write-Host "Running typecheck..."
npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Running RCE tests..."
npm run test:rce
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Running MVP conversation tests..."
npm run test:mvp-conversation
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Development check completed successfully."
Write-Host "The working tree may remain dirty in development mode."
