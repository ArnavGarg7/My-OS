<#
  My OS - boot startup script (Operations Sprint O1, Workstream 2). Windows/PowerShell.
  Waits for Docker Desktop's engine to be ready, then starts the production stack. Registered to run
  at logon by install-startup-task.ps1 so My OS comes up automatically after a reboot with no terminal.

  Manual run (for testing):
    powershell -ExecutionPolicy Bypass -File scripts\ops\windows\start-myos.ps1

  Env: MYOS_HOME (repo path; defaults to this script's repo) COMPOSE_FILE (infra\docker-compose.yml)
       PROFILE ("" or "tunnel" to also start Cloudflare Tunnel)
#>
$ErrorActionPreference = "Stop"

# Resolve the repo root: two levels up from scripts\ops\windows\.
$repo = if ($env:MYOS_HOME) { $env:MYOS_HOME } else { Resolve-Path (Join-Path $PSScriptRoot "..\..\..") }
Set-Location $repo
$ComposeFile = if ($env:COMPOSE_FILE) { $env:COMPOSE_FILE } else { "infra\docker-compose.yml" }
$ProfileArgs = @()
if ($env:PROFILE) { $ProfileArgs = @("--profile", $env:PROFILE) }

$logDir = Join-Path $repo "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir "startup.log"
function Log($m) { "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $m" | Tee-Object -FilePath $log -Append }

Log "startup: repo=$repo compose=$ComposeFile profile='$($env:PROFILE)'"

# 1. Ensure Docker Desktop is running (launch it if the engine isn't up yet).
if (-not (Get-Process "Docker Desktop" -ErrorAction SilentlyContinue)) {
  $dd = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dd) { Log "launching Docker Desktop"; Start-Process $dd } else { Log "WARN: Docker Desktop.exe not found at $dd" }
}

# 2. Wait for the Docker engine to accept commands (up to ~5 minutes after a cold boot).
Log "waiting for Docker engine..."
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  docker info *> $null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Start-Sleep -Seconds 5
}
if (-not $ready) { Log "ERROR: Docker engine did not become ready; aborting."; exit 1 }
Log "Docker engine ready"

# 3. Start the stack (idempotent: already-running containers are left as-is).
Log "starting My OS stack"
docker compose -f $ComposeFile @ProfileArgs up -d 2>&1 | Tee-Object -FilePath $log -Append
if ($LASTEXITCODE -ne 0) { Log "ERROR: compose up failed"; exit 1 }

Log "My OS started. http://localhost"
