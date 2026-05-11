# Sync dev → be and dev → fe (Windows PowerShell helper).
# Usage:  pwsh ./scripts/sync-branches.ps1
#
# Safety:
#   - Bails out if working tree has uncommitted changes.
#   - Uses --no-ff merge commits (per docs/CONTRIBUTING.md).
#   - Does NOT push automatically — review then `git push` manually.

$ErrorActionPreference = 'Stop'

function Fail($msg) {
  Write-Host "[sync] ERROR: $msg" -ForegroundColor Red
  exit 1
}

# 0. Clean working tree?
$status = git status --porcelain
if ($status) {
  Fail "Working tree not clean. Commit/stash before syncing."
}

# 1. Capture starting branch
$start = git rev-parse --abbrev-ref HEAD
Write-Host "[sync] Starting on $start"

# 2. Update dev
git checkout dev
git pull --ff-only
$devSha = git rev-parse --short HEAD
Write-Host "[sync] dev @ $devSha"

# 3. Merge dev → be
git checkout be
git pull --ff-only
git merge dev --no-ff -m "sync: dev → be ($devSha)"
$beSha = git rev-parse --short HEAD
Write-Host "[sync] be   @ $beSha (was synced from dev $devSha)"

# 4. Merge dev → fe
git checkout fe
git pull --ff-only
git merge dev --no-ff -m "sync: dev → fe ($devSha)"
$feSha = git rev-parse --short HEAD
Write-Host "[sync] fe   @ $feSha (was synced from dev $devSha)"

# 5. Return to starting branch
git checkout $start
Write-Host "[sync] Back on $start"

Write-Host ""
Write-Host "[sync] Done. Review and push:" -ForegroundColor Green
Write-Host "  git push origin be" -ForegroundColor Green
Write-Host "  git push origin fe" -ForegroundColor Green
Write-Host ""
Write-Host "Remember to update docs/SYNC.md with new SHAs." -ForegroundColor Yellow
