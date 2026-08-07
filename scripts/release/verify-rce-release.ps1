$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== RCE RELEASE VERIFICATION ==="
Write-Host ""

npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run test:rce
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run test:mvp-conversation
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run web:build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "RCE release verification completed successfully."
