<#
  My OS - database backup (Operations Sprint O1, Workstream 7). Windows/PowerShell variant.
  Gzipped, timestamped pg_dump of the Postgres container to a local folder; retains the last N.
  Local storage only. Safe to run any time.

    powershell -ExecutionPolicy Bypass -File scripts\ops\backup.ps1

  Env: PG_CONTAINER (myos-postgres-1) PG_USER (myos) PG_DB (myos) BACKUP_DIR (.\backups) RETAIN (7)

  Note: the dump is compressed INSIDE the container and copied out with `docker cp`. This avoids
  PowerShell's lossy binary-pipe handling (which would corrupt a gzip stream).
#>
$ErrorActionPreference = "Stop"

$PgContainer = if ($env:PG_CONTAINER) { $env:PG_CONTAINER } else { "myos-postgres-1" }
$PgUser      = if ($env:PG_USER)      { $env:PG_USER }      else { "myos" }
$PgDb        = if ($env:PG_DB)        { $env:PG_DB }        else { "myos" }
$BackupDir   = if ($env:BACKUP_DIR)   { $env:BACKUP_DIR }   else { ".\backups" }
$Retain      = if ($env:RETAIN)       { [int]$env:RETAIN }  else { 7 }

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$stamp   = Get-Date -Format "yyyyMMdd-HHmmss"
$leaf    = "myos-$stamp.sql.gz"
$out     = Join-Path $BackupDir $leaf
$tmpPath = "/tmp/$leaf"

Write-Host "[backup] dumping database '$PgDb' from container '$PgContainer' ..."
docker exec $PgContainer sh -c "pg_dump -U $PgUser -d $PgDb --clean --if-exists | gzip -9 > $tmpPath"
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed (exit $LASTEXITCODE)" }

docker cp "${PgContainer}:${tmpPath}" $out | Out-Null
docker exec $PgContainer rm -f $tmpPath | Out-Null

if (-not (Test-Path $out) -or (Get-Item $out).Length -eq 0) {
  Remove-Item -Force $out -ErrorAction SilentlyContinue
  throw "backup failed verification (empty file)"
}
$size = "{0:N1} MB" -f ((Get-Item $out).Length / 1MB)
Write-Host "[backup] wrote $out ($size)"

# Retention: keep the newest $Retain.
$all = Get-ChildItem -Path $BackupDir -Filter "myos-*.sql.gz" | Sort-Object LastWriteTime -Descending
if ($all.Count -gt $Retain) {
  $all | Select-Object -Skip $Retain | ForEach-Object {
    Write-Host "[backup] pruning old backup $($_.Name)"
    Remove-Item -Force $_.FullName
  }
}
Write-Host "[backup] done. $($all.Count) backup(s) present (retaining $Retain)."
