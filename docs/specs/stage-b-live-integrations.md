# Stage B — Live Integrations + Automation (Charter)

> **Status:** planned — not started (awaiting go-ahead) · **Prereq:** Stage A merged
> **Principle:** real external data flows through the *unchanged* Connectors → Events → Signals → Prediction → Automation → Chief pipeline. Connectors only answer "what changed?"; nothing downstream changes. No AI in the sync path; secrets never leave the server.

Today the connector framework ([[sprint64-connector-platform]]) is fully built but only **weather** is live — every other provider runs on clearly-labelled **sample** data. Stage B wires the real OAuth + fetch so Google Calendar, Gmail, GitHub, and Slack sync genuine data, and turns on automations that fire on real events.

## What already exists (build on, don't rebuild)
- `server/connectors/vault.ts` — AES-256-GCM `encryptSecret`/`secretHint` keyed by `MYOS_CONNECTOR_SECRET`. Secrets are encrypted immediately, never returned or logged.
- `server/connectors/service.ts` — `connect(providerId, label, secret)` stores an encrypted secret + moves lifecycle `disconnected → authenticating → connected`; `sync` folds normalized events into `signals/service`. `liveFetch` is an **injectable seam**, offline/sample by default (like AI Local).
- `server/connectors/capabilities.ts` — `LIVE_ENV` gates live-availability on an env var per provider: `google-calendar`/`gmail`/`google-drive` → `MYOS_GOOGLE_CLIENT_ID`, `github` → `MYOS_GITHUB_CLIENT_ID`, `slack` → `MYOS_SLACK_CLIENT_ID`, `weather` → `OPENWEATHER_API_KEY` (already live).
- `@myos/core/connectors` normalization (`NORMALIZE_MAP`) already maps provider payloads → `DomainEvent`s.

**The gap:** `connect()` takes a static `secret` string — there is no OAuth authorization/redirect/token-exchange/refresh flow, and no real `liveFetch` implementations. That is the Stage B build.

## Definition of Done
- At least one real external account (target: **Google Calendar**) connected via OAuth end-to-end: consent → callback → tokens in the vault → real events synced → appear as Signals/on the Calendar, with the pipeline unchanged.
- Token **refresh** works (expired access token silently refreshed; refresh-failure degrades honestly to "reconnect needed", never a crash).
- One **automation** fires on a genuine external event (e.g. GitHub issue assigned → task, or calendar event tomorrow → prep).
- Secrets only ever server-side; sample fallback still works for un-configured providers; disconnect fully removes tokens.
- Gates: typecheck, lint 0/0, build, repository-audit 8/8, tests; browser-verified.

---

## Part 1 — Credential setup (YOU perform these; I wire the code)

> **Boundary:** registering developer apps and obtaining client secrets requires signing into Google/GitHub/Slack and accepting their terms — I can't create accounts or enter credentials on your behalf. This section is the exact, minimal checklist; you paste the resulting IDs/secrets into `.env` (never into chat or a file I commit). I build everything that consumes them.

**Redirect/callback base:** the OAuth apps need a redirect URI. Local dev: `http://localhost:3000/api/connectors/oauth/callback/<provider>`. Production: `https://<your-domain>/api/connectors/oauth/callback/<provider>`. (Final path confirmed when I build the callback route — Part 2.)

### Google (Calendar + Gmail + Drive — one OAuth app covers all three)
1. Google Cloud Console → create/select a project.
2. "APIs & Services" → **Enable APIs**: Google Calendar API, Gmail API, Google Drive API.
3. "OAuth consent screen" → External, add yourself as a **test user** (keeps it in testing — no Google verification needed for personal use).
4. "Credentials" → Create **OAuth client ID** → Web application → add the redirect URIs above.
5. Copy **Client ID** and **Client secret**.
6. **Scopes** (least-privilege, read-first): `calendar.readonly`, `gmail.readonly`, `drive.metadata.readonly`.
→ `.env`: `MYOS_GOOGLE_CLIENT_ID`, `MYOS_GOOGLE_CLIENT_SECRET`.

### GitHub
1. GitHub → Settings → Developer settings → **OAuth Apps** → New OAuth App.
2. Homepage URL + **Authorization callback URL** (the redirect above for `github`).
3. Copy **Client ID**, generate a **Client secret**.
4. **Scopes**: `repo` (or `public_repo` if only public), `read:org` — read-first.
→ `.env`: `MYOS_GITHUB_CLIENT_ID`, `MYOS_GITHUB_CLIENT_SECRET`.

### Slack
1. api.slack.com/apps → **Create New App** (from scratch), pick your workspace.
2. "OAuth & Permissions" → add the redirect URL.
3. **Bot/User scopes** (read-first): `channels:history`, `channels:read`, plus `users:read` for mention resolution.
4. Install to workspace; copy **Client ID** + **Client Secret** (Signing Secret too if we verify events later).
→ `.env`: `MYOS_SLACK_CLIENT_ID`, `MYOS_SLACK_CLIENT_SECRET`.

**Env additions (secrets — server-only, never `NEXT_PUBLIC_`):** the three `*_CLIENT_SECRET` above join the existing `*_CLIENT_ID` (already in `LIVE_ENV`) and `MYOS_CONNECTOR_SECRET` (vault key — must be set). I'll extend `@myos/shared/env` schema + `.env.example` and document them in the deployment guide.

---

## Part 2 — What I build (server-side)

1. **OAuth flow (generic, provider-configured):**
   - `GET /api/connectors/oauth/start/<provider>` → builds the provider's authorize URL (scopes from the registry), sets a signed `state` (CSRF), redirects to the provider.
   - `GET /api/connectors/oauth/callback/<provider>` → verifies `state`, exchanges `code` for access+refresh tokens, encrypts both into the vault via the existing `connect()` path (extended to store a token bundle, not just a string), sets lifecycle → `connected`, redirects back to `/connectors`.
   - A small per-provider config (authorize URL, token URL, scopes, how to read the refresh response) — deterministic, table-driven like the existing registry.
2. **Token storage + refresh:** extend the vault record to hold `{accessToken, refreshToken, expiresAt}`; a `getFreshToken(account)` helper refreshes when expired and re-seals; refresh failure → lifecycle `authenticating`/needs-reconnect (honest), never a throw into the Event Engine.
3. **`liveFetch` implementations:** real HTTP for each provider mapping API payloads → the existing normalization (`NORMALIZE_MAP`) → `DomainEvent`s. Wire **Google Calendar first** end-to-end as the template, then Gmail, GitHub, Slack.
4. **Automations on real events:** enable/seed a couple of automation rules ([[sprint34-automation-engine]] / [[sprint63-proposal-first-automation]]) that trigger on the new real events — proposal-first where they mutate.
5. **UI:** the Connectors "Connect" button switches from the sample stub to launching the real OAuth `start` route when the provider is live-available; the honest sample path stays for un-configured providers.

## Security & guardrails
- Tokens live only in the encrypted vault (server); never returned by any query (only `secretHint`), never `NEXT_PUBLIC_`, never logged.
- `state` parameter signed to prevent CSRF on the callback.
- Least-privilege, read-first scopes (writes stay behind the existing honest write path).
- A connector failure/rate-limit degrades to sample/last-known and never throws upward (existing guarantee preserved).
- The Signals → Prediction → Automation → Chief pipeline needs **zero** changes — only the `extraEvents` seam feeds it, exactly as the sample path does today.

## Sequencing
1. Env schema + `.env.example` + the generic OAuth start/callback routes + `state` signing.
2. Vault token-bundle + refresh helper.
3. **Google Calendar** live end-to-end (fetch → normalize → sync → Signals/Calendar), browser-verified with your real account.
4. Gmail, GitHub, Slack in turn (reuse the template).
5. Real-event automations.
6. Gates + docs (deployment guide: the credential setup above).

## Risks
- OAuth redirect URIs differ dev vs prod — the flow must read the base from env/host, not hardcode.
- Google keeps the app in "testing" unless verified; fine for single-user (you're a test user), but note it if you ever share.
- Rate limits + token expiry are the main runtime concerns — handled by refresh + honest degradation.
- Requires your real developer credentials before step 3 can be verified end-to-end; steps 1–2 can be built and unit-tested without them.
