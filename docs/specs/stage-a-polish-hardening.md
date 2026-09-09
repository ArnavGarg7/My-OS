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
| ID | Finding | Anchor files |
|----|---------|--------------|
| A1.1 | Systematic hydration `useId` drift across all Radix components | `apps/web/app/providers.tsx`, `apps/web/components/shell/app-shell.tsx` |
| A1.2 | Chief greeting "Good morning" at 7 PM (Command Center is correct) | `apps/web/components/chief/chief-intelligence.tsx`, `apps/web/server/chief/composer.ts` |
| A1.3 | Connectors header "Live credentials configured" contradicts sample cards | `apps/web/components/connectors/ConnectorCenter.tsx` |
| A1.4 | Inbox row shows title + identical description | `apps/web/components/inbox/InboxRow.tsx` |
| A1.5 | Calendar external-calendar chip garbled label | `apps/web/components/calendar/CalendarExternal.tsx` |
| A1.6 | Recurring 500 / SyntaxError in console (likely cold-start DB-down; confirm) | server logs, offending Server Component read |
| A1.7 | "1 issue" badge — identify + make actionable or remove | `apps/web/components/platform/platform-banners.tsx`, `app-shell.tsx` |

Already landed on `readiness/daily-use` (Stage A's first commits): dev SW staleness, Pomodoro/Workspace session conflict, NL due-date loss.

## Workstream 2 — State completeness audit
Every route (PRIMARY/WORK/LIFE/INTELLIGENCE/SYSTEM) gets loading + empty/first-run + error states and an error boundary. Tracked with a per-route checklist.

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
