# Stage D — Native Mobile (Charter)

> **Status:** planned — not started (awaiting go-ahead on the approach) · **Prereq:** Stages A–C merged
> **Principle:** meet mobile users where they are without rebuilding the OS. Reuse the existing app; add native capability only where it earns its place.

## The central decision (read this first)
My OS is **already an installable, offline-capable, mobile-responsive PWA** — dynamic `manifest.ts`, a service worker (`public/sw.js`), an IndexedDB outbox that syncs on reconnect (`lib/offline`), a mobile bottom nav + drawer (Stage 8), and a responsive design verified at 375px in Stage A. So "native mobile" is a **distribution + native-capability** question, not a rebuild. Three paths:

1. **PWA-first (baseline — recommended first step).** Polish what exists: install prompts, iOS-specific meta/icons, splash, offline UX. Zero new stack. For a **single-user, self-hosted** OS this may be *entirely sufficient* — you install it to your home screen and it behaves like an app.
2. **Capacitor shell (the pragmatic "native" answer).** Wrap the deployed web app in a native iOS/Android project whose webview points at your server URL, and bridge **real native APIs**: reliable push (esp. iOS), **biometric unlock for the Secure Vault**, native share target, haptics, safe-area/status-bar, background sync. **Reuses 100% of the UI + logic.** Moderate effort. App-store-installable.
3. **Expo / React Native rebuild.** A full native rewrite of ~40 surfaces. **Not recommended** — it duplicates the entire app for marginal gain over Capacitor, and cuts against every "don't rebuild, reuse the engine" decision in this project.

**Recommendation:** do **(1) PWA hardening** now (a universal win, and I can build + verify it here), then **(2) Capacitor** for genuine app-store presence + native APIs — reusing everything. Skip (3).

## ⚠️ Honest environment constraint
A real native build **cannot be produced or run in this coding environment** — it needs your **Xcode (iOS) / Android Studio (Android)**, a physical device or simulator, and a **deployed My OS URL** for the shell to load. So the split is:
- **I can do here:** PWA hardening (build + browser-verify), the Capacitor project scaffold + config, native-plugin wiring in the web app (feature-detected so the PWA path is unaffected), build scripts, and full setup docs.
- **You do on your machine:** run `npx cap add ios/android`, open in Xcode/Android Studio, build/sign, test on device, submit. I'll give exact steps.

This is the same boundary as the OAuth developer-app setup in Stage B: I wire everything; the platform-specific build is yours.

## Definition of Done
- **PWA hardened:** installs cleanly on Android + iOS home screen, correct icons/splash/theme, offline shell works, install affordance surfaced. (Verifiable here.)
- **Capacitor shell scaffolded:** an iOS + Android project that loads the deployed app, builds locally per the docs, with native plugins wired behind feature detection: push, biometric Vault unlock, share target, haptics, safe-area.
- **Web app unaffected:** every native touch is capability-detected — the browser/PWA experience is identical when the native bridge is absent.
- Gates: typecheck, lint 0/0, build, repository-audit 8/8, tests; no regressions to the web app.

## Part A — PWA hardening (I build + verify here)
1. Audit the manifest (name, icons at all sizes, `display: standalone`, theme/background colors, shortcuts, share_target), fix gaps. Verify installability (Lighthouse-style checks / the browser install criteria).
2. iOS specifics: `apple-touch-icon`, `apple-mobile-web-app-*` meta, splash — iOS PWA needs these explicitly.
3. Offline UX polish: ensure the shell + last route load offline; the Stage-8 outbox already handles writes.
4. A subtle, honest install prompt (reuse the existing `useInstall` platform hook) — surfaced on mobile, dismissible.

## Part B — Capacitor shell (I scaffold + wire; you build)
1. `apps/mobile` (or a `capacitor/` dir): Capacitor config with `server.url` = the deployed instance (env-driven), app id/name/icons.
2. Native plugins, each **feature-detected** in the web app so the PWA path is untouched:
   - **Biometric unlock for the Secure Vault** — the highest-value native win: Face/Touch ID gates the passphrase entry (the passphrase/DEK still never leave the device; biometric just guards the unlock UX).
   - **Push** (native FCM/APNs) — more reliable than web push on iOS; bridges into the existing notification platform layer.
   - **Share target** (send text/links into Quick Add), **haptics**, **status-bar/safe-area** insets, **app-state** (lock the vault on background).
3. Build scripts + a `docs/mobile/` guide: prerequisites, `cap add`, signing, running on device, store submission.

## Part C — Native niceties (optional, after B lands)
Deep links (open a task/note from a notification), background sync tick, app-icon badge for unread. All feature-detected.

## Sequencing
1. **Part A (PWA hardening)** — now, here, verified. Delivers real mobile value immediately and is the honest baseline.
2. **Part B (Capacitor)** — scaffold + wire here; you build/test on your machine once there's a deployed URL. Lead with **biometric Vault unlock** (best native ROI).
3. **Part C** — only if wanted.

## Risks
- **Can't fully verify native here** — I scaffold + document; device build/test is yours. Charter is explicit about the split.
- Capacitor pointing at a remote SSR URL needs connectivity; the SW + offline outbox soften but don't eliminate that (a self-hosted personal app is usually online on the home network / tunnel).
- iOS is the fussy platform (PWA push limits, signing, review) — Capacitor is specifically what buys reliable iOS push + biometrics.
- Scope discipline: resist drifting toward a React Native rewrite — reuse is the whole point.
