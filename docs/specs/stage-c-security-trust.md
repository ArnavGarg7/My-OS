# Stage C — Security & Trust (Charter)

> **Status:** planned — not started (awaiting go-ahead) · **Prereq:** Stage B merged (real tokens + external data now live)
> **Principle:** never require blind trust. Protect data at rest and in transit, be honest about what the server, AI providers, and connectors can see, and never quietly weaken a security property for convenience.

Stage C hardens the OS now that real credentials and real external data flow through it. It is deliberately late in the plan: the data model is stable, so we can encrypt and audit against a known surface.

## The central decision (read this first)
**True end-to-end encryption (server can't read the data) fundamentally conflicts with this app's design.** My OS is server-rendered and its best features — Chief/AI reasoning, universal search, Signals, planning — run *server-side over the user's data*. If data is E2EE so the server is blind to it, those features cannot operate on it. So "E2EE where appropriate" must be scoped, not blanket. Stage C therefore defines **two tiers**:

- **Tier 1 — Encryption at rest (server-held key).** Broad. Protects against DB/backup theft. The server can still decrypt to run features. Extends the existing vault pattern (already used for connector + AI credentials) to `private`/`sensitive` data *bodies*.
- **Tier 2 — True E2EE (user passphrase, server-blind).** Opt-in, narrow. Only for data the user explicitly marks "private — OS/AI must never read": private journal entries, private notes, private memories. The trade-off is explicit and shown in the UI: **search, AI, and Signals do not work on Tier-2 data.** Decryption happens client-side.

## Threat model (honest, for a self-hosted single-user OS)
The user *owns the server* (their own Docker/host, O1 deployment). So "the server operator can read my data" is a weaker threat than for a SaaS — the user is the operator. The realistic threats, in priority order:
1. **DB / backup theft** — a stolen `pg_dump` or backup file exposing plaintext bodies + tokens. → Tier 1 encryption at rest.
2. **What leaves the system** — data sent to external AI providers / connectors. → already bounded by `AI_SAFE_SURFACES`; audit + surface it.
3. **Device / session compromise** — someone reaching the running app. → auth/session/rate-limit hardening.
4. **Defense-in-depth for the most private notes** — even against the server itself. → Tier 2 E2EE, opt-in.

## What already exists (build on, don't rebuild)
- **Classification registry** (`apps/web/lib/security/classification.ts`, Phase 4.5): every schema file is `public|internal|sensitive|private` with rationale + per-table overrides; `security-audit.mjs` enforces registration. This is the map of *what to encrypt*.
- **AI-safe boundary**: raw `sensitive`/`private` rows never go to an external model (`AI_SAFE_SURFACES` allowlist).
- **Two AES-256-GCM vaults**: connector credentials (`MYOS_CONNECTOR_SECRET`) and AI credentials (`MYOS_AI_CREDENTIALS_SECRET`) — the proven encrypt-at-rest pattern (`encryptSecret`/`decryptSecret`, sealed `{ciphertext, iv, tag}`, key never returned).
- **Phase 4.5 hardening** + v1.0.0 Caddy security headers + structured logging with redaction.
- **Gap:** `private` bodies (journal/knowledge notes, inbox captures, collaboration messages, AI memories, identity email) are stored **plaintext** in Postgres today.

## Definition of Done
- Every `private` data *body* is encrypted at rest (Tier 1) — a stolen DB/backup reveals no plaintext journal/note/message/token content; existing rows migrated.
- A working Tier-2 opt-in: mark an item private → it's stored server-blind (ciphertext only), unlocked client-side with the passphrase, with search/AI honestly disabled on it and a recovery path that works.
- Hardening audit complete with findings fixed or tracked: authz on every mutation, OAuth-token handling, secret scanning, rate limiting, upload validation, audit log for sensitive actions.
- A **Privacy & Security** page: what's stored, what's encrypted (which tier), what each AI provider + connector can see, what's deletable.
- Gates: typecheck, lint 0/0, build, `security-audit.mjs` + repository-audit 8/8, tests; no plaintext-secret regressions.

---

## Part A — Tier 1: encryption at rest (server-held key)
1. **Field-encryption helper** generalizing the vault: `sealField`/`openField` (AES-256-GCM) keyed by a new `MYOS_DATA_ENCRYPTION_KEY` (distinct from the credential secrets; isolated). Drizzle custom type or repository-layer transparent encrypt/decrypt so services stay unchanged.
2. **Scope** = the `private` bodies from the registry (journal entries, knowledge/note bodies, inbox content, collaboration message bodies, AI memories, identity email). Driven by the classification registry so it can't drift.
3. **Migration** — encrypt existing plaintext rows in place (forward-only; a one-time backfill). Search over encrypted fields becomes exact-match/tokenized or moves to a derived index (decide per field).
4. **Key handling** — key from env (like the vaults), never logged, documented for the O1 deployment + backup/restore (the key must be backed up separately from the DB, or the data is unrecoverable).

## Part B — Tier 2: true E2EE (opt-in, server-blind)
1. **Key derivation** — a user **encryption passphrase** (separate from login) → Argon2id → master key. Per-item DEK wrapped by the master key. The passphrase + derived key never reach the server (server stores only wrapped keys + ciphertext).
2. **Unlock UX** — enter passphrase once per session to unlock Tier-2 data client-side; a clear locked state otherwise.
3. **Client-side crypto** — those fields are served as ciphertext and decrypted in the browser (WebCrypto). New ciphertext-only API paths for them.
4. **Recovery + multi-device** — a one-time recovery code (shown once) that can re-derive/rewrap the master key; the passphrase (or recovery code) unlocks a new device. No server-side reset (server can't — that's the point).
5. **Explicit trade-off in the UI** — Tier-2 items show "AI & search off (end-to-end encrypted)". Signals/Chief skip them.

## Part C — Hardening audit
Authz on every tRPC mutation (owner-only; single-user assumption made explicit); OAuth token lifecycle (refresh-failure → reconnect, revoke-on-disconnect — partly from Stage B); secret scanning in CI; rate limiting on auth + internal endpoints; upload validation (size/type) if any; an append-only audit log for sensitive actions (credential changes, exports, deletions). Reuse Phase 4.5 audit scripts; extend where thin.

## Part D — Privacy & Security transparency page
A real page (not marketing): per data domain — where it lives, encryption tier, whether AI/connectors can see it, retention/deletion. Generated from the classification registry so it stays truthful.

## Sequencing
1. **Hardening audit (Part C) + Tier 1 (Part A)** first — highest ROI, lowest risk, protects the real Stage-B tokens + bodies against the top threat (backup theft).
2. **Transparency page (Part D)** — cheap once Tier 1 lands; makes the guarantees visible.
3. **Tier 2 E2EE (Part B)** last — the hard part (key management, recovery, client crypto, feature trade-offs); its own careful sub-pass.

## Risks
- **Lost key = lost data** (both tiers). Backup/restore + recovery-code design must be bulletproof and clearly documented, or a user locks themselves out.
- **Encrypted fields break search/sort/filter** — decide per field (tokenized index vs. exact-match vs. accept client-only).
- **Tier-2 conflicts with SSR/AI** — must be genuinely scoped to opt-in data, or it silently breaks the OS's best features.
- **Migration of existing plaintext** is one-way and must be verified (backup first).
- Performance: per-field GCM on hot read paths — measure; cache decrypted values within a request only.
