<#
  My OS - service status (Operations Sprint O1, Workstream 8). Windows/PowerShell variant.
  One-glance operational status: containers + health, app health endpoint, backup freshness, disk.
  Read-only.

    powershell -ExecutionPolicy Bypass -File scripts\ops\status.ps1
#>
$ErrorActionPreference = "Continue"

$ComposeFile = if ($env:COMPOSE_FILE) { $env:COMPOSE_FILE } else { "infra\docker-compose.yml" }
$HealthUrl   = if ($env:HEALTH_URL)   { $env:HEALTH_URL }   else { "http://localhost/api/health" }
$BackupDir   = if ($env:BACKUP_DIR)   { $env:BACKUP_DIR }   else { ".\backups" }

Write-Host "== My OS status - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') =="

Write-Host "`n-- containers --"
docker compose -f $ComposeFile ps

Write-Host "`n-- app health --"
try { Invoke-RestMethod -Uri $HealthUrl -TimeoutSec 3 | ConvertTo-Json -Compress }
catch { Write-Host "UNREACHABLE ($HealthUrl)" }

Write-Host "`n-- backups --"
$b = Get-ChildItem -Path $BackupDir -Filter "myos-*.sql.gz" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
if ($b) {
  $latest = $b | Select-Object -First 1
  "{0}: {1} ({2:N1} MB), {3} total" -f "latest", $latest.Name, ($latest.Length / 1MB), $b.Count
} else {
  Write-Host "no backups found in $BackupDir - run scripts\ops\backup.ps1"
}

Write-Host "`n-- disk --"
$drive = (Get-Item -LiteralPath (Get-Location)).PSDrive
if ($drive) {
  $freeGB = [math]::Round($drive.Free / 1GB, 1)
  $usedGB = [math]::Round($drive.Used / 1GB, 1)
  $total  = $drive.Free + $drive.Used
  $pct    = if ($total -gt 0) { [math]::Round(($drive.Used / $total) * 100) } else { 0 }
  "drive {0}: {1}% used, {2} GB free (used {3} GB)" -f $drive.Name, $pct, $freeGB, $usedGB
}
Write-Host "`ndocker footprint:"
docker system df
