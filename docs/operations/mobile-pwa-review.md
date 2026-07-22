# Mobile / PWA Readiness Review (Workstream 5)

Verification that the **existing** PWA is production-ready on Android Chrome. **No redesign** — this is a
readiness audit. **Result: READY**, no code changes required.

| Item | Status | Evidence |
| --- | --- | --- |
| Installable | ✅ | `app/manifest.ts` → `id`, `name`, `short_name`, `display: standalone`, `start_url: /today`, `scope: /`. Served at `/manifest.webmanifest` and linked from `layout.tsx`. |
| Icons | ✅ | 192 + 512 `any`, plus 192 + 512 **maskable** (`/icons/*`); `apple-touch-icon.png` for iOS. |
| Theme | ✅ | `theme_color` + `background_color` `#0a0a0c`; `viewport.themeColor` in `layout.tsx`. |
| Splash screen | ✅ | Derived by the browser from `name` + `background_color` + icons; `appleWebApp` meta set for iOS. |
| Safe areas | ✅ | `viewport.viewportFit: "cover"` in `layout.tsx` so content respects notch/insets. |
| Orientation | ✅ | `orientation: "any"` — portrait and landscape. |
| Offline assets | ✅ | `public/sw.js` caches the app shell; `public/offline.html` served when offline. |
| Responsive / touch | ✅ | Shell + every Center use responsive Tailwind layouts; controls are standard touch targets. |
| Shortcuts | ✅ | Manifest shortcuts: Today, Planner, Inbox, Settings. |
| Screenshots | ✅ | `screenshots` for `wide` (desktop) and `narrow` (mobile) form factors — richer install UI. |
| `display_override` | ✅ | `["window-controls-overlay", "standalone", "minimal-ui"]`. |

## How to install

See the [Android Setup Guide](android-setup.md). In short: open the **HTTPS** URL in Chrome → **⋮ →
Install app**.

## Constraints (not defects)

- **Install requires HTTPS.** Use the Cloudflare URL for a home-screen app that also works away from
  home (a plain LAN-IP `http://` origin can't be installed).
- **Dynamic data needs connectivity.** The offline cache covers the shell + offline page; live tRPC data
  requires the server to be reachable. This matches the deterministic, server-owns-truth architecture.

## Conclusion

The PWA meets production mobile-readiness with no changes. Installation, standalone display, theming,
safe areas, offline shell, and notifications infrastructure are all present and verified in source.
