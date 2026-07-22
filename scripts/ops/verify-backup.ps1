<#
  My OS - backup verification (Operations Sprint O1, Workstream 7). Windows/PowerShell variant.
  Proves a backup is restorable by restoring it into a throwaway database inside the Postgres
  container, counting tables, then dropping the scratch DB. Never touches the live database.

    powershell -ExecutionPolicy Bypass -File scripts\ops\verify-backup.ps1 [-File path\to\backup.sql.gz]
#>
param([string]$File)
$ErrorActionPreference = "Stop"

$PgContainer = if ($env:PG_CONTAINER) { $env:PG_CONTAINER } else { "myos-postgres-1" }
$PgUser      = if ($env:PG_USER)      { $env:PG_USER }      else { "myos" }
$BackupDir   = if ($env:BACKUP_DIR)   { $env:BACKUP_DIR }   else { ".\backups" }
$Scratch     = "myos_verify_$PID"

if (-not $File) {
  $latest = Get-ChildItem -Path $BackupDir -Filter "myos-*.sql.gz" -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $latest) { throw "no backup found in $BackupDir" }
  $File = $latest.FullName
}
if (-not (Test-Path $File)) { throw "backup file not found: $File" }
Write-Host "[verify] archive: $File"

$leaf = Split-Path $File -Leaf
docker cp $File "${PgContainer}:/tmp/$leaf" | Out-Null
try {
  docker exec $PgContainer psql -U $PgUser -d postgres -c "CREATE DATABASE `"$Scratch`";" | Out-Null
  docker exec $PgContainer psql -U $PgUser -d $Scratch -c "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS citext;" 2>$null | Out-Null
  docker exec $PgContainer sh -c "gunzip -c /tmp/$leaf | psql -U $PgUser -d $Scratch >/dev/null 2>&1"
  $count = (docker exec $PgContainer psql -U $PgUser -d $Scratch -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';").Trim()
  if ([int]$count -gt 0) {
    Write-Host "[verify] OK - backup restored cleanly with $count public tables."
  } else {
    throw "restore produced 0 tables; backup is NOT trustworthy."
  }
} finally {
  docker exec $PgContainer psql -U $PgUser -d postgres -c "DROP DATABASE IF EXISTS `"$Scratch`";" 2>$null | Out-Null
  docker exec $PgContainer rm -f "/tmp/$leaf" 2>$null | Out-Null
}
