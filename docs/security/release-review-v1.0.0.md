# Security Review — v1.0.0

Verification of the security posture for the 1.0.0 release. **Result: PASS** with two documented,
non-blocking follow-ups (app-side CSP, API rate limiting) appropriate to a single-owner self-hosted
deployment.

## Summary

| Area | Status | Notes |
| --- | --- | --- |
| Connector vault | ✅ PASS | AES-256-GCM; ciphertext + iv + auth tag; server-only. |
| AI secrets | ✅ PASS | Server-only env; never logged; never sent to the browser. |
| Encryption | ✅ PASS | AES-256-GCM (connectors) + provider-credentials secret (AI). |
| Environment variables | ✅ PASS | Validated via zod; unused `SESSION_SECRET` removed; `.env.example` complete. |
| Credential boundaries | ✅ PASS | No decrypt on any query path; `connect` returns only a `•••1234` hint. |
| Server-only secrets | ✅ PASS | `import "server-only"` on every secret-touching module. |
| Data classification | ✅ PASS | 31/31 schema files classified; credentials are `private`, AI-inaccessible. |
| No secret reaches client | ✅ PASS | Only `NEXT_PUBLIC_*` public values are exposed (Clerk publishable key, VAPID public key). |
| HTTP security headers | ✅ ADDED | HSTS, nosniff, frame-options, referrer-policy, permissions-policy at Caddy. |
| CORS | ✅ PASS | Same-origin app (tRPC over Next route handlers); no cross-origin API surface. |
| Content-Security-Policy | ⚠️ FOLLOW-UP | Deferred: needs app-side nonces + Clerk/PWA testing. |
| API rate limiting | ⚠️ FOLLOW-UP | Not present; low risk for single-owner + Clerk-gated deployment. |
| Permissions | ✅ PASS | Connectors are read-first, least-privilege scopes; every route is `protectedProcedure`. |

## Credential vault (connectors, 6.4)

- `apps/web/server/connectors/vault.ts` — `encryptSecret` / `decryptSecret` use **AES-256-GCM** with a
  random 12-byte IV per encryption and an authentication tag (tamper → throws). The key is scrypt-
  derived from `MYOS_CONNECTOR_SECRET`, a **dedicated** secret distinct from the AI credentials secret,
  so connector secrets are isolated from the AI subsystem.
- The repository stores only sealed ciphertext (`ciphertext`, `iv`, `tag`) plus a non-secret display
  `hint`. **`decryptSecret` and `loadCredential` are never called from any router or query path** —
  confirmed by grep; decrypt exists solely for the (currently offline) live-sync seam.
- `connectors.connect` returns `{ accountId, state, hint }` — a `•••1234` hint, never the secret.
- `connector_credentials` is classified **private** and is on the AI-inaccessible list.

## AI secrets

- All provider keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`,
  `VOYAGE_API_KEY`) and `MYOS_AI_CREDENTIALS_SECRET` are server-side only, validated in
  `packages/shared/src/env.ts`, never `NEXT_PUBLIC_`, and never logged.
- Provider credentials pasted at runtime are stored encrypted in `provider_credentials` and never
  returned through the API (5.3). The Local provider needs no key.

## Client exposure audit

Only these values are `NEXT_PUBLIC_` (public by design): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
`NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_MYOS_VAPID_PUBLIC_KEY`.
All are intended public tokens (publishable key, routes, VAPID public key). **No secret is exposed.**

## Data-classification enforcement

`node scripts/security-audit.mjs` → **PASS**: 31 schema files, 31 classified, 0 unclassified. AI-safe
surfaces are limited to 6 derived read models (summary, signals, statusSignal, dashboard, portfolio,
statistics). Raw `sensitive`/`private` rows never cross the AI boundary.

## Changes made in this review

- Added baseline HTTP security headers to `infra/Caddyfile` (HSTS, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, strip `Server`). Edge-only;
  no application or architecture change.
- Removed unused `SESSION_SECRET`; documented `MYOS_CONNECTOR_SECRET` in `.env.example`.

## Follow-ups (non-blocking, tracked in future-work)

1. **App-side Content-Security-Policy** with per-request nonces, tested against Clerk + the PWA service
   worker + inline styles. Deferred because a naive CSP would break the app.
2. **API rate limiting** on the tRPC surface. Low priority: the deployment is single-owner and every
   procedure is authenticated (`protectedProcedure`); Clerk gates all access.
