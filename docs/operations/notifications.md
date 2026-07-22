# Notifications (Workstream 6)

How notifications behave after deployment, and their honest limits.

## What's in place

- **In-app notification engine** (Sprint 3.3) — deterministic rules, quiet hours, mute, escalation,
  dedup, snooze; every reminder/alert the OS surfaces flows through it. Visible in the Notification
  Center and the status bar.
- **Web Push infrastructure** (Sprint 1.7) — a platform push provider (`lib/platform/providers/push.tsx`),
  a device-subscription table (`platform` schema), and VAPID env keys
  (`MYOS_VAPID_PUBLIC_KEY` / `MYOS_VAPID_PRIVATE_KEY` / `MYOS_VAPID_SUBJECT` /
  `NEXT_PUBLIC_MYOS_VAPID_PUBLIC_KEY`). The service worker (`public/sw.js`) receives push events.

## Enabling browser notifications after deployment

1. **Set VAPID keys** in `.env` (generate with `npx web-push generate-vapid-keys`). Set
   `NEXT_PUBLIC_MYOS_VAPID_PUBLIC_KEY` to the **same value** as `MYOS_VAPID_PUBLIC_KEY`.
2. **Serve over HTTPS** — push and installable PWAs require it. Use the Cloudflare URL
   ([Remote Access](remote-access.md)); `localhost` is treated as secure for testing on the same
   machine.
3. **Grant permission** — in the app (Settings → Platform) or when the browser prompts. This registers a
   push subscription tied to that browser/device.
4. Notifications now arrive as native OS notifications even when the tab is in the background (and, on
   Android, when the installed PWA is closed).

## Behaviour

- **Foreground:** in-app toasts + the Notification Center always work, no push needed.
- **Background / closed (with push configured):** delivered via the OS notification tray.
- **Multiple devices:** each browser/device you grant permission on gets its own subscription; the
  worker fans out to all of them.

## Limitations (be aware)

- **Requires HTTPS + VAPID.** Without the Cloudflare URL and VAPID keys, you get in-app notifications
  only (no background OS notifications).
- **Delivery depends on the machine being on.** This is a self-hosted personal deployment — if your PC
  (and its worker) is off, background jobs and pushes don't fire until it's back on. Notifications
  generated while offline surface when the OS next runs (generation is on-demand, not an always-on
  cloud).
- **iOS** supports Web Push only for **installed** PWAs (iOS 16.4+). Android Chrome supports it for both
  tabs and installed PWAs.
- **Browser/OS gates.** The user's browser and OS notification settings can independently block delivery;
  re-grant in site settings if they stop appearing.

## Verifying

- Grant permission, then trigger a notification (any rule, or a test from the Notification Center) and
  confirm it appears in the OS tray. On Android, background-test by closing the PWA first.
