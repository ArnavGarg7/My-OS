# Stage A — Polish & Hardening (Charter)

> **Status:** in progress · **Branch:** `stage-a/polish-hardening` (off `readiness/daily-use`)
> **Principle:** the app must feel shippable to someone who has never seen the code. No feature work. No shortcuts.

Stage A closes the "not ready for daily use" gap. It is the polish/hardening pass over the assembled app (Stages 1–9). It does **not** add capabilities.

## Definition of Done
Verified in a **production build**, all must hold:
- Zero console errors **or** warnings on a clean load, across all ~30 routes.
- Every surface has real loading, empty, and error states — no dead-ends.
- Keyboard + screen-reader usable; contrast meets WCAG AA.
- Correct at 375 px (phone), 768 px (tablet), and desktop on every surface.
- Graceful degradation through the reliability scenarios (no raw 500s, no white screens).
- Gates green: typecheck, lint 0/0, build, repository-audit 8/8, tests.

## Workstream 1 — Correctness bugs (sweep findings, 2026-09-09)
| ID | Finding | Status | Anchor files |
|----|---------|--------|--------------|
| A1.1 | Hydration `useId` drift on Radix components | ✅ **Fixed.** Root-caused via isolation: `/showcase` (same Radix components, but outside the async `force-dynamic` shell layout) hydrated cleanly, so the `await requireUser()` in the shell layout was shifting Radix's `useId` origin between server and client. Fix: wrap the shell output in an explicit `<Suspense>` so `useId` measures tree ids from a boundary present identically on server and during hydration. Verified cold under `reactStrictMode:true`: zero hydration warnings on Command Center + Collaboration (Tabs). | `apps/web/app/(shell)/layout.tsx` |
| A1.2 | Chief greeting "Good morning" at 7 PM — was a **systemic timezone bug** (day-phase/working-hours read the server clock, UTC in prod) | ✅ **done** (`b091a87`), browser-verified | `packages/core/today/planner.ts`, `packages/ai/chief/morning.ts`, +threading |
| A1.3 | Connectors header "Live credentials configured" contradicts sample cards | open | `apps/web/components/connectors/ConnectorCenter.tsx` |
| A1.4 | Inbox row shows title + identical description | open | `apps/web/components/inbox/InboxRow.tsx` |
| A1.5 | Calendar external-calendar chip garbled label | open | `apps/web/components/calendar/CalendarExternal.tsx` |
| A1.6 | Recurring 500 / SyntaxError in console | ✅ **settled — stale cold-start (DB-down) artifact**; server log clean once Postgres healthy. (Graceful cold-start UX tracked under WS5) | — |
| A1.7 | "1 issue" badge — identify + make actionable or remove | open | `apps/web/components/platform/platform-banners.tsx`, `app-shell.tsx` |

Already landed on `readiness/daily-use` (Stage A's first commits): dev SW staleness, Pomodoro/Workspace session conflict, NL due-date loss.

## Workstream 2 — State completeness audit ✅ complete
Audited from code across all 41 page routes.
- **Error boundaries: solid** (pre-existing, Phase 4.5). `(shell)/error.tsx` (design-system native, reports via the client reporter, `reset()` recovery) covers every shell route; `global-error.tsx` self-contained fallback; on-brand root `not-found.tsx`. No dead-ends.
- **Loading: one real gap found + fixed.** Broad component-level coverage (87 files use `PageLoading`/`isLoading`/`Spinner`). The 9 analytics sub-dashboards each fetch their own slice on tab-switch and rendered `null` while in flight → a tab flashed blank. Added a shared `analytics/DashboardState` (spinner while loading, "not enough data" when empty) and applied it to all 9. Verified: Finance tab renders cleanly, no blank flash.
- **Empty states: good.** Primary surfaces have thoughtful empty copy (verified 10 in the sweep + analytics now covered). The remaining `return null`-on-empty cases are optional cards / `*StatusIndicator` badges where rendering nothing is correct.
- No route shows a blank white screen: the shell chrome renders immediately (client-fetched content is guarded beneath it).

## Workstream 3 — Accessibility (WCAG AA)
Keyboard nav (⌘K palette, tab order, modal focus traps), visible focus rings, aria labels on icon-only controls, screen-reader pass on the daily loop, contrast audit of muted-on-dark text.

## Workstream 4 — Responsive audit
All surfaces at 375 / 768 / desktop: no horizontal scroll, tap targets ≥ 44 px, bottom-nav present, modals→sheets on mobile, wide content scrolls inside its container.

## Workstream 5 — Reliability scenarios
DB/server restart (graceful reconnect, no 500), offline→online sync, sync conflict (LWW) honesty, expired OAuth (stub until Stage B), AI provider failure → Local fallback, push failure non-blocking.

## Workstream 6 — Performance (last, light)
Prod-build measurement: dashboard first paint, the batched Command Center query load (split critical vs deferred), search + AI latency, bundle size. Set budgets, fix regressions.

## Execution order
1. Reproduce-clean baseline (prod build, healthy DB) — separates real bugs from cold-start noise (settles A1.1/A1.6 scope).
2. Workstream 1 fixes, each browser-verified.
3. Workstreams 2–4 audits (checklist-driven).
4. Workstream 5 reliability.
5. Workstream 6 performance.
6. Final gates + full clean-load console sweep across all routes.

One branch, logically-grouped commits, browser proof per workstream. No `Co-Authored-By: Claude` trailer per repo convention.
