# Daily Usage Guide

How My OS fits into a normal day once it's deployed.

## It's just there

After the [Windows auto-start](windows-install.md) is set up, you don't start anything. Turn on your
laptop, log in, wait a minute for Docker, and My OS is running at **http://localhost** (and at your
Cloudflare URL from anywhere).

- **Laptop:** open the PWA (installed from Chrome/Edge) or `http://localhost`.
- **Phone:** open the installed PWA from your home screen.
- **Away:** open `https://myos.yourdomain.com` in any browser.

## A typical loop

1. **Morning** — open **Chief** (the default home): "what should I do right now?", grounded in your
   real state. Read the **Morning Briefing** / **Today**.
2. **During the day** — **Planner** for your timeline, **Tasks**/**Inbox** to capture and organize,
   **Focus** for deep work. **Signals** surfaces risks/opportunities; **Autopilot** shows any safe,
   reversible proposals waiting for your approval.
3. **Evening** — **Tomorrow Studio** to close today and plan tomorrow.
4. **Anytime** — **Journal**, **Health**, **Finance**, **Knowledge**, **Goals**, and the rest.

Nothing acts on its own: every plan change and automation is a **proposal you approve**.

## Signing in

Authentication is Clerk (if configured) or local single-owner mode. Away-from-home access adds a second
gate (Cloudflare Access) in front of the app — see [Remote Access](remote-access.md).

## AI, optionally

With no API keys, the **Local** AI provider answers everything (simpler, fully offline). Add a provider
key in **Settings → AI** to use Anthropic/OpenAI/Gemini/Groq; keys are encrypted server-side and never
sent to the browser.

## Notifications

Grant the notification permission once (laptop and/or phone). Reminders and alerts arrive as browser
notifications. See [Notifications](notifications.md) for behaviour and limits.

## Good habits

- Let the **daily backup** run (set it up once — [Backup Guide](backup.md)).
- Glance at `scripts\ops\status.ps1` if something feels off.
- **Update** monthly with `scripts\ops\update.ps1` ([Upgrade Guide](upgrade.md)).
