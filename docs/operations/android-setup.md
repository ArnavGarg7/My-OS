# Android Setup Guide

My OS is a PWA — install it on your phone so it opens full-screen like a native app.

## Prerequisites

- My OS reachable from your phone. Either:
  - **On your home Wi-Fi:** `http://<your-pc-name>.local` or `http://<PC-LAN-IP>` (find it with
    `ipconfig`), or
  - **Anywhere:** your Cloudflare hostname `https://myos.yourdomain.com` (see
    [Remote Access](remote-access.md)). **Installing the PWA requires HTTPS** — so for a home-screen app
    that works away from home, use the Cloudflare URL.

## Install (Android Chrome)

1. Open the URL in **Chrome**.
2. Sign in (Clerk).
3. Tap the **⋮ menu → Install app** (or "Add to Home screen"). Chrome offers this because the manifest
   and service worker are present.
4. Confirm. My OS appears on your home screen with the app icon.

Launching from the home screen opens it **standalone** (no browser chrome), in the theme colour
`#0a0a0c`, using the maskable icons and the app shortcuts (Today / Planner / Inbox / Settings) from the
manifest.

## What already works (verified — see the [PWA review](mobile-pwa-review.md))

- **Installable** — valid `manifest.webmanifest` with `id`, `name`, `standalone` display, 192/512 icons
  + maskable variants, and shortcuts.
- **Responsive & touch-friendly** — the shell and all Centers use responsive Tailwind layouts.
- **Offline shell** — the service worker caches the app shell and serves an offline page when the
  network drops (dynamic data needs connectivity).
- **Theme / splash** — `theme_color` + `background_color` drive the status bar and the generated splash.
- **Orientation** — `any` (works portrait and landscape).

## Notifications on Android

Web Push works in installed PWAs on Android Chrome. Grant the notification permission when prompted (or
Settings → notifications). Requires HTTPS (the Cloudflare URL) and the VAPID keys configured on the
server. See [Notifications](notifications.md) for the full picture and limitations.

## Tips

- If "Install app" doesn't appear, confirm you're on **HTTPS** and reload once (the service worker must
  register first).
- To update the installed app, just reopen it — the service worker picks up new versions; the in-app
  update banner appears when a new build is available.
