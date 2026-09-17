# @myos/mobile — Capacitor Android shell (Stage D)

A native Android WebView that loads the **deployed** My OS web app and adds native push, deep-link
auth return, and platform chrome. **Android-only** for now (config is kept iOS-neutral for later).

This package holds the Capacitor **config** and (once generated) the native `android/` project. The
app's actual UI is the deployed web app in `apps/web` — it carries the guarded Capacitor client code
(push registration, native auth) that activates only when running inside the native shell.

## Division of labor

- **In-repo (done by the web/Claude side):** `capacitor.config.ts`, the guarded native client code in
  `apps/web` (`lib/platform/native/*`, wired into `PlatformProvider`), and the server-side FCM sender
  (`apps/web/server/notification/push-fcm.ts`) + `push.registerDevice` API.
- **Native build + consoles (this README — needs the Android SDK, a device, and Google/Firebase
  consoles):** everything below.

## Prerequisites

- Node + pnpm (repo already uses them), **Android Studio** + Android SDK + a JDK 17.
- A **Firebase project** (for FCM push).
- The owner's Google account added as a **Test user** on the Google OAuth consent screen.

## First-time setup

```bash
# from repo root
pnpm install

# generate the native Android project (creates apps/mobile/android/)
pnpm --filter @myos/mobile cap:add:android

# copy web config + install native plugin modules into the android project
pnpm --filter @myos/mobile cap:sync
```

`capacitor.config.ts` points the WebView at `https://myosarnav.duckdns.org` by default. For local dev
against a LAN dev server, set `MYOS_MOBILE_SERVER_URL=http://<your-lan-ip>:3000` before `cap:sync`
(and temporarily allow cleartext).

## Firebase Cloud Messaging (push)

1. In the **Firebase console**, add an **Android app** with package name **`com.arnavgarg.myos`**.
2. Download **`google-services.json`** and place it at `apps/mobile/android/app/google-services.json`
   (gitignored — never commit it).
3. Ensure the Google Services Gradle plugin is applied (Capacitor's template usually wires this; if
   not, add `com.google.gms.google-services` to `android/build.gradle` + `android/app/build.gradle`).
4. In Firebase **Project settings → Service accounts → Generate new private key**. From that JSON set
   these envs on the **Oracle deployment** (server side, the sender in `apps/web`), then recreate the
   container:
   - `MYOS_FCM_PROJECT_ID` = `project_id`
   - `MYOS_FCM_CLIENT_EMAIL` = `client_email`
   - `MYOS_FCM_PRIVATE_KEY` = `private_key` (keep the `\n` escapes; the sender un-escapes them)

## Google sign-in (deep-link return)

Google blocks OAuth inside a WebView, so sign-in opens the **system browser** and returns to the app
via a deep link. The app registers the custom scheme handled by the App plugin listener in
`apps/web/lib/platform/native/native-auth.ts`.

1. Add the app's redirect scheme to `AndroidManifest.xml` (intent-filter for
   `com.arnavgarg.myos://auth`) — see the native-auth module's header for the exact contract.
2. In **Google Cloud Console**, the existing Web OAuth client's callback stays for the web app; the
   native return is a one-time-token hand-off to the WebView (server endpoint is the remaining design
   task — see `native-auth.ts` TODO). No Android OAuth client is needed for the system-browser flow,
   but if a native Google Sign-In plugin is chosen later, register an **Android OAuth client** with the
   signing **SHA-1** (see below).

## Signing (release)

```bash
keytool -genkey -v -keystore myos-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias myos
# get the SHA-1 (needed if/when an Android OAuth client is used)
keytool -list -v -keystore myos-release.jks -alias myos
```

Keep the keystore + passwords **out of git** (see `.gitignore`). Wire them via
`android/keystore.properties` (also gitignored).

## Build & run

```bash
pnpm --filter @myos/mobile cap:run          # build + install on a connected device/emulator
# or open in Android Studio to build an APK/AAB:
pnpm --filter @myos/mobile cap:open
```

## Exit criteria (Stage D V1)

Installable Android app → Google sign-in via system browser → core surfaces usable → quick capture
from outside the app → **push received while the app is closed** → works offline then syncs.
