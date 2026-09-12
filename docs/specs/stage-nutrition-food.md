# Stage — Nutrition / Food Module (Charter)

> **Status:** in progress (2026-09-12) · branch `stage-nutrition/food-module` (from `main`)
> **Principle:** AI/parsing understands *what was said*; the **food database (USDA FoodData Central) is
> the source of truth** for calories/macros. If a food can't be resolved, **ask — never guess**.

## Audit → decision: extend, don't duplicate
The app already had the storage: `health.health_daily` (day rollup), `health.hydration_logs` (water),
`health.body_measurements` (weight), `life.supplements`, and `core/health/nutrition.ts`; voice via
`lib/interaction/use-voice.ts`; capture via Quick Add / Omni; the offline outbox. The gap was a coarse
`nutrition_logs` (aggregate macros only) and no food-DB resolution, planning, or goals. So this **extends**
those tables rather than adding a parallel engine.

## Part A — backend (this commit)
- **Schema (migration 0047):** extend `nutrition_logs` with food identity/portion/provenance/planned
  (`name, brand, quantity, unit, fiber, sugar, sodium, source, source_ref, planned, consumed_on`); new
  `nutrition_goals` (daily targets, single active row). Additive — legacy rows untouched.
- **Pure core `@myos/core/nutrition`:** deterministic meal parser (`"2 eggs and a bowl of rice"` →
  items), portion→grams, per-100g scaling, day totals (planned vs actual), goal progress. Tested (9).
- **Food DB resolver `server/nutrition/food-db.ts`:** USDA FoodData Central search → per-100g macros
  (source of truth). Direct request/response (not a synced connector); `FDC_API_KEY` (free) with a
  `DEMO_KEY` fallback so it works out of the box.
- **Service + tRPC `nutrition.*`:** `resolveMeal` (parse → DB candidates to review), `search`, `logFood`,
  `removeFood`, `logWater`, `logWeight`, `getGoals`/`setGoals`, `day`. Keeps `health_daily` in sync so the
  existing Health surfaces reflect nutrition.

## Part B — UI (done)
Dedicated `/nutrition` page (nav item under the Life group): a day dashboard (calories/protein/carbs/fat
bars vs goal + water + weight), the **food logger** (type or **voice** via `use-voice` → `resolveMeal`
→ **review the DB match + confirm grams** → log; unresolved foods show "no match" instead of guessing),
planned vs actual diary, water + weight quick-logs, and an editable daily-goals panel. `components/nutrition/*`.

## Part C — food cascade + Today (done)
- **Resolution cascade** so common/Indian/branded foods resolve instead of "no match": USDA →
  **Open Food Facts** (keyless; branded + Indian packaged like Maggi) → **AI estimate** (Gemini,
  feature-local, flagged `estimated`). Databases first; the estimate is an honest, labelled fallback the
  user still confirms. `source` now `usda | off | ai | manual`; the logger shows the source badge.
- **Today panel** (`NutritionTodayPanel`) in the morning briefing — macros vs goal + water, links to
  `/nutrition`; renders only once something is logged.
- **Auth fix (shipped with this):** Google sign-in requested Calendar/Gmail/Drive (restricted) scopes,
  which Google blocks at login for an unverified app (`Error 400: invalid_request`). Sign-in is now
  **identity-only** (`openid email profile`); the Google connector requests its scopes separately via the
  connector flow. `MYOS_OWNER_EMAILS` unchanged.

## Later (optional)
A Quick Add / Omni "Log food" path, offline-outbox registration for the log mutations, surfacing
supplements (`life.supplements`), and connector-scope re-consent when the owner wants Google connectors.

## Deploy
Migration 0047 auto-applies. Set **`FDC_API_KEY`** in `.env` for reliable food-DB throughput (DEMO_KEY
works for light use). Voice uses the browser's speech API (already in-app).

## Gates
db + core + web typecheck, lint 0/0, core tests (9), health tests still green (22), security-audit
(health.ts already classified), repository-audit 8/8, migration forward-only.
