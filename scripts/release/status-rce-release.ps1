$ErrorActionPreference = "Continue"

function Run-Check {
  param(
    [string]$Label,
    [string]$Command
  )

  Write-Host ""
  Write-Host "[$Label]"

  Invoke-Expression $Command | Out-Host
  $ok = $LASTEXITCODE -eq 0

  if ($ok) {
    Write-Host "Result: OK"
  } else {
    Write-Host "Result: FAILED"
  }

  return $ok
}

Write-Host ""
Write-Host "=============================="
Write-Host "        RCE STATUS"
Write-Host "=============================="
Write-Host ""

$branch = git branch --show-current
if ($LASTEXITCODE -ne 0) {
  $branch = "(unknown)"
}

$status = git status --porcelain
$gitOk = $LASTEXITCODE -eq 0
$modified = @($status | Where-Object { $_ -notmatch "^\?\?" }).Count
$untracked = @($status | Where-Object { $_ -match "^\?\?" }).Count
$clean = $gitOk -and $status.Count -eq 0

Write-Host "Branch: $branch"
Write-Host "Modified/staged: $modified"
Write-Host "Untracked: $untracked"
Write-Host "Working tree clean: $clean"

$typecheckOk = Run-Check "TYPECHECK" "npm run typecheck"
$rceOk = Run-Check "RCE TESTS" "npm run test:rce"
$mvpOk = Run-Check "MVP CONVERSATION TESTS" "npm run test:mvp-conversation"
$buildOk = Run-Check "WEB BUILD" "npm run web:build"

$releaseBranch = $branch -eq "feature/rce-runtime"
$ready = $clean -and $releaseBranch -and $typecheckOk -and $rceOk -and $mvpOk -and $buildOk

Write-Host ""
Write-Host "=============================="
Write-Host "SUMMARY"
Write-Host "=============================="
Write-Host "Correct release branch: $releaseBranch"
Write-Host "Ready for release: $ready"

if (-not $ready) {
  Write-Host ""
  Write-Host "Development can continue, but strict release preparation is not yet possible."
}
