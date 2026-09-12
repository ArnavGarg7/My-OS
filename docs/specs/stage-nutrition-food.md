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

## Part B — UI + integration (next)
Dedicated `/nutrition` page under the Life nav group: a day view with macro rings vs goal, the food log
(type/voice → resolve → **review candidate + confirm portion** → log), planned vs actual, water + weight
quick-logs, and goals. Wire Quick Add / Omni (a "Log food" path reusing `use-voice`), a Today macro
summary, and offline (logs queue like any mutation). Supplements reuse `life.supplements`.

## Deploy
Migration 0047 auto-applies. Set **`FDC_API_KEY`** in `.env` for reliable food-DB throughput (DEMO_KEY
works for light use). Voice uses the browser's speech API (already in-app).

## Gates
db + core + web typecheck, lint 0/0, core tests (9), health tests still green (22), security-audit
(health.ts already classified), repository-audit 8/8, migration forward-only.
