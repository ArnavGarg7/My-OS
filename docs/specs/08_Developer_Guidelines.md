# 08 — Developer Guidelines

**Project:** My OS
**Audience:** anyone (human or AI) writing code in this repo. These rules are enforceable in review and, where possible, by tooling.

---

## 1. Repository & Folder Structure

```
myos/
├─ apps/
│  ├─ web/
│  │  ├─ app/                        # Next.js App Router
│  │  │  ├─ (auth)/login/            # public segment
│  │  │  ├─ (app)/                   # authenticated shell segment
│  │  │  │  ├─ page.tsx              # Today (Morning Briefing / Day / Evening)
│  │  │  │  ├─ inbox/ planner/ calendar/ tasks/ projects/[projectId]/
│  │  │  │  ├─ college/ internship/ notes/[noteId]/ journal/[date]/
│  │  │  │  ├─ habits/ health/ finance/ goals/ timeline/ analytics/
│  │  │  │  ├─ plan/week/ review/month/ assistant/ automations/
│  │  │  │  ├─ notifications/ search/ settings/[section]/
│  │  │  │  # Focus Mode & Tomorrow Studio are overlays/wizards, not routes
│  │  │  ├─ api/trpc/[trpc]/route.ts
│  │  │  ├─ api/events/route.ts      # SSE
│  │  │  ├─ api/push/action/route.ts
│  │  │  ├─ api/share/route.ts       # PWA share target → Life Inbox
│  │  │  └─ api/health/route.ts
│  │  ├─ components/                 # page-level compositions (feature folders mirror routes)
│  │  ├─ lib/                        # client utils: trpc client, mutations, query keys, shortcuts
│  │  ├─ server/                     # routers/, auth/, sse/, context.ts
│  │  └─ public/                     # manifest, icons, sw
│  └─ worker/
│     └─ src/ (index.ts, jobs/, schedulers/, consumers/)   # one file per job
├─ packages/
│  ├─ core/        # PURE domain logic only — no IO, no DB, no fetch
│  ├─ db/          # schema/ (per domain), migrations/, queries/, seed/
│  ├─ ai/          # clients/, context/, tools/, prompts/ (.md), features/
│  ├─ shared/      # zod schemas (dto/), enums, constants, dates/, result types
│  └─ ui/          # tokens.css, primitives/, composites/, icons.ts
├─ e2e/            # Playwright specs + fixtures
├─ infra/          # compose files, Caddyfile, scripts/ (backup, deploy, restore), runbooks/
└─ docs/           # these 9 documents + ADRs (docs/adr/NNN-title.md)
```

**Layering rule (import direction):** `ui → (nothing app-specific)`; `shared → nothing`; `core → shared`; `db → shared`; `ai → core, db, shared`; `apps → everything`. Enforced with `eslint-plugin-boundaries`. `packages/core` must stay side-effect free (unit-testable without infrastructure).

## 2. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files/folders | kebab-case | `time-block-card.tsx`, `habit-streaks.ts` |
| React components | PascalCase, one component per file, named export | `TimeBlockCard` |
| Hooks | `useXxx` | `usePlannerDrag` |
| Variables/functions | camelCase; booleans `is/has/can/should` | `isOverdue` |
| Types/interfaces | PascalCase, no `I` prefix; zod schema `xxxSchema`, inferred type same name | `taskSchema` / `Task` |
| Constants | SCREAMING_SNAKE in `shared/constants` | `MAX_FOCUS_MINUTES` |
| DB tables/columns | snake_case plural tables | `habit_logs.local_date` |
| tRPC | `domain.verbNoun` | `tasks.bulkComplete`, `planner.generateDraft` |
| pg-boss jobs | `domain.action` | `notifications.dispatch`, `ai.plan.pregenerate` |
| Domain events | `entity.pastTenseVerb` | `task.completed`, `budget.thresholdCrossed` |
| Env vars | `MYOS_`-prefixed except vendor standards | `MYOS_APP_URL`, `ANTHROPIC_API_KEY` |
| Branches | `feat/ fix/ chore/ refactor/` + kebab summary | `feat/planner-drag` |
| CSS | Tailwind utilities; tokens only via CSS vars; no hex literals in components | — |

## 3. Coding Standards

- **TypeScript strict** (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). `any` forbidden (`unknown` + narrowing); `as` casts require a comment justifying them.
- **Validation at boundaries:** every tRPC input/output, job payload, JSONB column, and imported file is parsed with zod from `packages/shared`. Inside the boundary, trust types.
- **Errors:** domain code returns typed results or throws typed `AppError(code, meta)`; never throw strings; user-facing messages mapped centrally.
- **Dates:** all logic through `shared/dates` (Temporal-polyfill based helpers); never `new Date()` arithmetic in features; store UTC + `local_date` per 05 §0.
- **Transactions:** any mutation touching >1 table uses `db.transaction`; `activity_log` + `domain_events` written inside it (helper `writeWithEvents()` — using it is mandatory, reviewed).
- **React:** server components for static reads, client components for interaction; no data fetching in components (hooks in `lib/queries`); optimistic mutation helpers from `lib/mutations`; lists >100 rows must virtualize; every async UI has skeleton/error/empty states (DRD §7) — PR checklist item.
- **Accessibility:** interactive elements are buttons/links, not divs; `aria-label` on icon buttons; keyboard path exercised in the PR demo gif.
- **Comments** state non-obvious constraints only ("RRULE expanded 12mo ahead because scanner never looks further"). No narration, no changelog comments.
- **Formatting/lint:** Prettier + ESLint (typescript, react-hooks, boundaries, tailwind plugins) — CI-enforced, zero warnings policy.
- **Dependencies:** adding one requires an ADR line (why, alternatives, size); `pnpm audit` gate in CI.

## 4. Git Workflow

- **Trunk-based:** `main` is always deployable; short-lived feature branches → PR (even solo — the PR is the review artifact and AI-review surface) → squash-merge.
- **Conventional Commits** (`feat: … / fix: … / chore: …`) — drives changelog generation.
- PR template: what/why, screenshots or gif for UI, checklist (states covered, tests, migration reversible, docs touched).
- **Migrations:** one per PR max, never edit a merged migration, always additive-first (expand → migrate data → contract in a later PR). Down-migrations required.
- **Releases:** tag `vX.Y.Z`; deploy = CI images + compose pull on VPS; pre-deploy DB dump automatic (04 §11). Rollback = previous tag + restore-if-needed runbook.

## 5. Testing Standards

| Layer | Tool | Scope & rules |
|---|---|---|
| Unit | Vitest | All `packages/core` logic (recurrence, scheduling, streaks, priority, budgets, automation eval) — golden-fixture style; DST/timezone fixtures mandatory for anything date-touching. Target ≥90% branch on core |
| DB/API integration | Vitest + Testcontainers Postgres | Every tRPC router happy path + error paths; migration up/down smoke; outbox written with mutations |
| Worker | Vitest + Testcontainers | Scanner/dispatcher timing with fake clock; automation soak fixture; rollover job |
| AI | Vitest (mocked SDK) + prompt fixtures | Tool schemas validate; agent loop handles refusal/max_tokens/pause_turn; structured outputs schema-checked; validator/repair path; **no live-API tests in CI** (a manual `pnpm eval` script runs live smoke evals) |
| E2E | Playwright | One spec per feature happy path incl. PWA install-less push mock; auth flows; export/import round-trip |
| Visual | Playwright screenshots on `packages/ui` stories | Token/theme regressions |

Rules: tests colocated (`*.test.ts`); factories in `packages/db/seed/factories.ts` shared by tests & dev seed; deterministic time via injected clock everywhere (no `Date.now()` in domain code); flaky test = quarantined same day, fixed within a week.

## 6. Documentation Standards

- These nine `/docs` documents are living: any PR that changes behavior described here must update the doc in the same PR ("docs-sync" checklist item).
- **ADRs** (`docs/adr/`) for every architectural decision or deviation from these docs — short template: context / decision / consequences.
- Each package has a `README.md` (purpose, public API, how to test). Prompts in `packages/ai/prompts/*.md` carry a header: purpose, inputs, output schema, last-evaluated date.
- Runbooks (`infra/runbooks/`): deploy, restore, password-reset CLI, key rotation, VPS migration, benchmarks — each a numbered command list tested at least once.
- Changelog auto-generated from commits per release; `docs/CHANGELOG.md`.

## 7. Environment & Secrets

- `.env.example` is the complete authoritative variable list with comments; real `.env` never committed; server copy root-readable only.
- Local dev: `pnpm i && docker compose -f infra/compose.dev.yml up -d && pnpm db:migrate && pnpm db:seed && pnpm dev`. Must work with **no** AI keys (degraded per NFR-9).
- Scripts (root package.json): `dev, build, test, test:e2e, lint, typecheck, db:migrate, db:seed, db:studio, eval, deploy`.

## 8. Code Review Checklist (applies to AI-generated code too)

1. States: loading / empty / error / offline handled?
2. Keyboard + aria on anything interactive?
3. Transaction + outbox on multi-table writes?
4. Zod at every boundary crossed?
5. Dates via `shared/dates`, `local_date` where day-bucketed?
6. Index exists for any new query pattern (check EXPLAIN)?
7. Soft-delete respected in reads?
8. Tokens, not hex; components from `packages/ui` before new ones?
9. Tests at the right layer; fixtures not snapshots-of-everything?
10. Docs/ADR updated?
