# Windows Installation Guide

Make My OS behave like installed software: turn on your laptop, and My OS is running — no terminal.

## 1. Docker Desktop: start on login

Docker Desktop → **Settings → General** → enable **"Start Docker Desktop when you sign in"** → Apply.
This brings the Docker engine up automatically after every boot. (The My OS startup task waits for the
engine regardless, so this just makes startup faster.)

Also set **Settings → Resources** to something comfortable (e.g. 4 GB RAM). My OS is light, but Postgres
+ Next.js want a little headroom.

## 2. Register My OS auto-start

From the repo root, in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\ops\windows\install-startup-task.ps1
```

This creates a Task Scheduler task **"My OS Autostart"** that, ~30 s after you log in, runs
`start-myos.ps1`, which:

1. Launches Docker Desktop if it isn't already running.
2. Waits (up to ~5 min) for the Docker engine to be ready.
3. Runs `docker compose ... up -d` to start the whole stack.

A log is written to `logs\startup.log`.

### Options

```powershell
# also start the Cloudflare tunnel at boot (after you've set MYOS_TUNNEL_TOKEN in .env)
$env:PROFILE = "tunnel"; powershell -ExecutionPolicy Bypass -File scripts\ops\windows\install-startup-task.ps1

# test the startup script immediately (without rebooting)
powershell -ExecutionPolicy Bypass -File scripts\ops\windows\start-myos.ps1

# remove the auto-start task
powershell -ExecutionPolicy Bypass -File scripts\ops\windows\install-startup-task.ps1 -Uninstall
```

## 3. Confirm

Reboot. After you log in and wait ~1–2 minutes (Docker engine cold start), open **http://localhost** —
My OS should be up. Check `logs\startup.log` and `scripts\ops\status.ps1` if not; see
[Troubleshooting](troubleshooting.md).

## 4. Optional: a desktop shortcut

Create a shortcut to `http://localhost` (or install the PWA from Chrome/Edge — see
[Android Setup](android-setup.md); desktop install works the same way) so My OS opens in its own window
like a native app.

## Notes

- The task runs as **your user** at **logon** (not at boot before login) so it has access to Docker
  Desktop, which itself runs per-user. This is the correct model for a personal single-user machine.
- Containers use `restart: unless-stopped`, so if Docker restarts, My OS comes back on its own too.
