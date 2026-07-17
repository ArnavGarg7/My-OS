# AI Extension Guidelines (Phase 4.5 → Phase 5)

Phase 5 adds an AI layer on top of the frozen deterministic system. These are the rules that layer
must follow so it enhances the OS without compromising determinism, ownership, or privacy. **The
deterministic core is the source of truth; the AI is an advisor and an interface, never an owner.**

## 1. Read only through AI-safe surfaces

The AI may read the derived server read models on the allowlist in
[../security/data-classification.md](../security/data-classification.md):
`summary`, `signals`, `statusSignal`, `dashboard`, `portfolio`, `statistics`. These are
aggregated, scored, non-identifying. **Never** feed raw `sensitive`/`private` rows (journal/note
bodies, transactions, health logs, contacts, calendar titles) to an external model.

Gather AI context the same way `apps/web/server/intelligence/composer.ts` does: one server-side
composer reading read models, never importing another domain's core.

## 2. Write only through owning services

The AI proposes; the deterministic services dispose. To change data, call the owning domain's
**service** (which validates with zod and runs the pure rules) — never write tables directly and
never bypass a domain's rules. Ownership is mapped in [../architecture/domains.md](../architecture/domains.md).

## 3. Preserve determinism

- AI outputs are **suggestions**, surfaced to the user, not silent mutations.
- Do not route deterministic decisions through the model. The Decision, Planner, Scheduler, and
  rule engines stay deterministic; the AI may explain or summarise their output, not replace it.
- Keep the AI layer's own persistence separate (as Intelligence keeps config/snapshots separate
  from the data it reads). Do not cache read-model output as a new source of truth.

## 4. Respect the freeze

- The public API surface is frozen ([../api/public-api.md](../api/public-api.md)) — build on it,
  don't break it. `scripts/api-audit.mjs` fails CI if a required export disappears.
- Add no cross-domain core imports (`scripts/dependency-graph.mjs`).
- Classify any new persisted data before reading it into AI context
  (`scripts/security-audit.mjs`).

## 5. Honour observability & performance baselines

- Every AI-triggered server call goes through the same tRPC observability middleware — it will be
  logged with a request id. Keep AI operations attributable.
- The core derivations are sub-millisecond ([../performance/baseline.md](../performance/baseline.md));
  composing them for AI context is cheap. Do not regress route bundles
  ([../performance/bundle.md](../performance/bundle.md)) by shipping heavy client-side AI code.

## 6. Checklist for any AI feature

- [ ] Reads only AI-safe surfaces; no raw sensitive/private data leaves the system.
- [ ] Writes only via owning services; determinism preserved.
- [ ] New persisted data classified in `classification.ts`.
- [ ] No new cross-domain core import; API audit still green.
- [ ] Suggestions surfaced to the user, not applied silently.
- [ ] Gates green (typecheck/lint/test/build) and audit scripts pass.
