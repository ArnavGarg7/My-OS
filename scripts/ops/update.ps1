<#
  My OS - safe update workflow (Operations Sprint O1, Workstream 11). Windows/PowerShell variant.
    git pull -> backup DB -> build images -> run migrations -> start -> health check.
  If health fails, your data is safe (fresh backup taken) and prior images remain for rollback.

    powershell -ExecutionPolicy Bypass -File scripts\ops\update.ps1

  Env: COMPOSE_FILE (infra\docker-compose.yml) HEALTH_URL (http://localhost/api/health) PROFILE ("")
#>
$ErrorActionPreference = "Stop"

$ComposeFile = if ($env:COMPOSE_FILE) { $env:COMPOSE_FILE } else { "infra\docker-compose.yml" }
$HealthUrl   = if ($env:HEALTH_URL)   { $env:HEALTH_URL }   else { "http://localhost/api/health" }
$ProfileArgs = @()
if ($env:PROFILE) { $ProfileArgs = @("--profile", $env:PROFILE) }

Write-Host "== My OS update =="

Write-Host "[1/6] git pull"
git pull --ff-only
if ($LASTEXITCODE -ne 0) { throw "git pull failed" }

Write-Host "[2/6] backup database (safety net before any migration)"
& "$PSScriptRoot\backup.ps1"

Write-Host "[3/6] build updated images"
docker compose -f $ComposeFile @ProfileArgs build
if ($LASTEXITCODE -ne 0) { throw "build failed" }

Write-Host "[4/6] apply migrations + start services"
docker compose -f $ComposeFile @ProfileArgs up -d
if ($LASTEXITCODE -ne 0) { throw "compose up failed" }

Write-Host "[5/6] wait for health"
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
  try { Invoke-RestMethod -Uri $HealthUrl -TimeoutSec 3 | Out-Null; $ok = $true; break } catch { Start-Sleep -Seconds 2 }
}

Write-Host "[6/6] result"
if ($ok) {
  Invoke-RestMethod -Uri $HealthUrl | ConvertTo-Json -Compress
  Write-Host "[update] SUCCESS - My OS is online and healthy."
} else {
  Write-Warning "[update] health check did not pass in time."
  Write-Host "         Your pre-update backup is in .\backups. Inspect logs:"
  Write-Host "         docker compose -f $ComposeFile logs --tail=100 web worker migrate"
  Write-Host "         To roll back, restore the latest backup: scripts\ops\restore.ps1"
  exit 1
}
