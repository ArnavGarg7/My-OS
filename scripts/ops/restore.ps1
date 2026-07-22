<#
  My OS - database restore (Operations Sprint O1, Workstream 7). Windows/PowerShell variant.
  DESTRUCTIVE: overwrites the current database from a gzipped pg_dump backup. Takes a safety backup
  first and requires confirmation.

    powershell -ExecutionPolicy Bypass -File scripts\ops\restore.ps1 [-File path\to\backup.sql.gz] [-Force]

  Env: PG_CONTAINER (myos-postgres-1) PG_USER (myos) PG_DB (myos) BACKUP_DIR (.\backups)
#>
param(
  [string]$File,
  [switch]$Force
)
$ErrorActionPreference = "Stop"

$PgContainer = if ($env:PG_CONTAINER) { $env:PG_CONTAINER } else { "myos-postgres-1" }
$PgUser      = if ($env:PG_USER)      { $env:PG_USER }      else { "myos" }
$PgDb        = if ($env:PG_DB)        { $env:PG_DB }        else { "myos" }
$BackupDir   = if ($env:BACKUP_DIR)   { $env:BACKUP_DIR }   else { ".\backups" }

if (-not $File) {
  $latest = Get-ChildItem -Path $BackupDir -Filter "myos-*.sql.gz" -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $latest) { throw "no backup file found in $BackupDir" }
  $File = $latest.FullName
}
if (-not (Test-Path $File)) { throw "backup file not found: $File" }

Write-Host "[restore] target DB '$PgDb' in container '$PgContainer'"
Write-Host "[restore] source   $File"
if (-not $Force) {
  $ans = Read-Host "[restore] This OVERWRITES the current database. Type 'restore' to continue"
  if ($ans -ne "restore") { Write-Host "[restore] aborted."; exit 1 }
}

Write-Host "[restore] taking a safety backup of the current database first ..."
try { & "$PSScriptRoot\backup.ps1" } catch { Write-Warning "safety backup failed; continuing per your confirmation." }

# Copy the archive into the container, then gunzip | psql inside it (avoids PowerShell binary piping).
$leaf = Split-Path $File -Leaf
docker cp $File "${PgContainer}:/tmp/$leaf" | Out-Null
Write-Host "[restore] restoring ..."
docker exec $PgContainer sh -c "gunzip -c /tmp/$leaf | psql -U $PgUser -d $PgDb -v ON_ERROR_STOP=1 >/dev/null"
$code = $LASTEXITCODE
docker exec $PgContainer rm -f "/tmp/$leaf" | Out-Null
if ($code -ne 0) { throw "restore failed (exit $code)" }

Write-Host "[restore] done. Restart the app so it reconnects cleanly:"
Write-Host "          docker compose -f infra\docker-compose.yml restart web worker"
