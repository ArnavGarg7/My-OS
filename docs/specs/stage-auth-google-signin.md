# Stage — Google Sign-In (Auth.js) (Charter)

> **Status:** in progress (2026-09-12) · branch `stage-auth/google-signin` (based on `ops/single-owner-prod-mode`)
> **Why:** the live deploy launched on single-owner + a Caddy password gate. The owner wants a real
> **Google sign-in** ("like Proxima") instead. This makes Google the identity backend, drops the
> password gate, and lets the Google connector auto-connect from the same sign-in grant.

## The decision
Clerk was ruled out on the DuckDNS host earlier (its production instances need CNAME records DuckDNS
can't provide). **Auth.js (NextAuth) v5** with a **Google provider** needs only the OAuth app + an https
redirect URI — both of which we have — so it works on the deployed instance with no DNS gymnastics. It
slots behind the app's existing pluggable `IdentityService`: the abstraction already states "replacing
Clerk means reimplementing the provider seam + the client `signOut`; nothing else moves."

## What was built (Part A — sign-in)
- **`auth.config.ts`** (edge-safe): Google provider, **email allowlist** (`MYOS_OWNER_EMAILS`) enforced in
  the `signIn` callback (fail-closed — empty allowlist = nobody), `authorized` callback for route gating,
  `trustHost: true` (so callback URLs are https behind Caddy). Reads `process.env` directly to stay light
  in the edge runtime.
- **`auth.ts`** (Node): the full instance spreading `authConfig` + `jwt` callback that persists the Google
  grant (access/refresh token, expiry, scope) on the encrypted JWT — for connector seeding (Part B).
- **`app/api/auth/[...nextauth]/route.ts`**: Auth.js handlers.
- **Server seam** `server/identity/google.ts` (reads the session) + `server/identity/provider.ts`
  (dispatch: Clerk → Google → none). `service.ts` now branches on `externalAuthEnabled()` and imports
  the provider seam via `provider.ts` — otherwise unchanged.
- **Client seams**: `AuthShellProvider` mounts Auth.js `SessionProvider` in Google mode; `google-bridge`
  supplies `signOut`; `AuthSignIn` renders a "Continue with Google" button. `config.ts` adds
  `googleAuthConfigured` (from `NEXT_PUBLIC_MYOS_GOOGLE_AUTH`).
- **Middleware**: dispatches Clerk → Auth.js (`authorized` gate) → pass-through by env.
- **Env**: `MYOS_GOOGLE_AUTH` + `NEXT_PUBLIC_MYOS_GOOGLE_AUTH` (build-inlined), `AUTH_SECRET`,
  `MYOS_OWNER_EMAILS`. Reuses `MYOS_GOOGLE_CLIENT_ID/SECRET`. Fail-loud env guard when enabled but
  missing prerequisites. Build arg + Dockerfile ARG for the public flag.

## What remains (Part B — connector auto-seed)
Seed the Google connector (Calendar/Gmail/Drive) from the sign-in grant already captured on the JWT, so
signing in connects Google automatically (no second OAuth dance). Sign-in already requests the connector
read scopes with a refresh token. Wire on the `signIn` event → seal the tokens into the connector
credential (reusing `connectOAuth`/`repo.updateCredential`).

## Deployment impact (owner does on the VM)
1. Google console: add redirect URI `https://myosarnav.duckdns.org/api/auth/callback/google`.
2. `.env`: `MYOS_GOOGLE_AUTH=true`, `NEXT_PUBLIC_MYOS_GOOGLE_AUTH=true`, `AUTH_SECRET=<openssl rand -base64 33>`,
   `MYOS_OWNER_EMAILS=arnavgargdark@gmail.com`. (`MYOS_GOOGLE_CLIENT_ID/SECRET` already set.)
3. Rebuild (the public flag is build-inlined): `docker compose --env-file .env -f infra/docker-compose.yml up -d --build`.
4. **Remove the password gate**: delete `infra/conf.d/auth.caddy`, `docker compose ... restart caddy`.
   Google login is now the gate; `MYOS_SINGLE_OWNER` becomes irrelevant (leave blank).

## Verification boundary
Sign-in flow (the Google OAuth round-trip) can't be fully exercised here — it needs the Google console
callback + a real Google account. Verified here: typecheck, lint, identity tests, repo audit, and the
production build. The live round-trip is verified on deploy (mirrors the Stage B OAuth split).

## Gates
typecheck ✓ · lint 0/0 ✓ · identity tests ✓ · repository-audit 8/8 ✓ · next build (see PR).
