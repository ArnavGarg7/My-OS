<#
  My OS - register auto-start at logon (Operations Sprint O1, Workstream 2). Windows/PowerShell.
  Creates a Task Scheduler task that runs start-myos.ps1 shortly after you log in, so My OS is
  available automatically after every reboot with no terminal commands. Run ONCE (as your normal user;
  elevation is only needed if you choose the at-boot variant).

    powershell -ExecutionPolicy Bypass -File scripts\ops\windows\install-startup-task.ps1
    powershell -ExecutionPolicy Bypass -File scripts\ops\windows\install-startup-task.ps1 -Uninstall

  Also enable Docker Desktop's own "Start Docker Desktop when you log in" (Settings > General) so the
  engine is coming up in parallel. start-myos.ps1 waits for the engine regardless.
#>
param(
  [switch]$Uninstall,
  [string]$TaskName = "My OS Autostart",
  [int]$DelaySeconds = 30
)
$ErrorActionPreference = "Stop"

if ($Uninstall) {
  if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "[startup] removed scheduled task '$TaskName'."
  } else {
    Write-Host "[startup] no task named '$TaskName' found."
  }
  return
}

$startScript = Join-Path $PSScriptRoot "start-myos.ps1"
if (-not (Test-Path $startScript)) { throw "start-myos.ps1 not found next to this script" }

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startScript`""

# At logon, delayed a little so Docker Desktop's engine has a head start.
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = ("PT{0}S" -f $DelaySeconds)

$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 2 -RestartInterval (New-TimeSpan -Minutes 1)

$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
  -Settings $settings -Principal $principal -Force -Description "Starts My OS (Docker Desktop + compose) at logon." | Out-Null

Write-Host "[startup] registered '$TaskName' to run at logon (+${DelaySeconds}s delay)."
Write-Host "[startup] test it now:  powershell -ExecutionPolicy Bypass -File `"$startScript`""
Write-Host "[startup] remove later: install-startup-task.ps1 -Uninstall"
