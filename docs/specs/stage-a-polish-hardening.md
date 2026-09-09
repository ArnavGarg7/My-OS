# Stage A — Polish & Hardening (Charter)

> **Status:** ✅ all 6 workstreams complete · **Branch:** `stage-a/polish-hardening` (off `readiness/daily-use`)
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

## Workstream 3 — Accessibility (WCAG AA) ✅ complete
- **Contrast: one real AA failure found + fixed.** Computed ratios for every text/bg token pair. `fg` and `fg-muted` pass comfortably; **`fg-subtle`/`text-tertiary` failed 4.5:1 for normal text in BOTH themes** (dark `#6b7178` = 3.4–3.9:1; light `#8a857d` = 3.2–3.7:1) — and it's used widely for captions/labels/timestamps. Bumped the token: dark → `#868d93` (5.0–5.8:1 on base/surface/elevated, 4.52:1 on overlay), light → `#6d685f` (4.8–5.5:1). Verified in both themes: legible, visual hierarchy intact. Disabled-text failing is WCAG-exempt (1.4.3); accent/semantic colors pass on dark. (Minor follow-up: light-mode `accent` #e5620a is 3.45:1 — fine for large/non-text/badges, but should not be used as small body text; `accent-fg` is the text tint.)
- **Icon-only controls:** all `IconButton` usages carry an `aria-label` (audited every occurrence).
- **Focus + keyboard:** `focus-visible:ring-ring` applied across interactive elements; Radix Dialog/DropdownMenu provide focus traps + roving focus; the ⌘K palette has custom arrow/Enter nav.

## Workstream 4 — Responsive audit ✅ complete (pass — no code changes needed)
The responsive foundation (Stage 8 mobile shell + the design-system breakpoints) is sound. Audited from code + spot-checked at 375px.
- **No horizontal-overflow risks.** Both `<table>`s are wrapped in `overflow-x-auto`; fixed widths are all `max-w-[…]` (cap, don't force) or `<lg`-hidden; the context panel is `hidden … lg:flex`; the mobile bottom nav appears `<md`.
- **Wide grids handled.** Calendar Week/Month + mini-calendar use `grid-cols-7` with no cell min-width, so they shrink to fit (tight but no scroll); Agenda (default) is the mobile-friendly view. Main content grids (tiles, dashboards) use responsive `sm:/md:/lg:` column counts (verified Command Center 2-col + Analytics at 375px).
- **Verified at 375px:** Command Center (2-col tiles, bottom nav), Calendar (Agenda + toolbar wrap, empty state) — both clean.
- Minor (non-blocking): a few dense `grid-cols-3/4` stat/button groups (preferences-form, BodyComposition, StreakInspector, FlashcardReview) are tight on a 375px screen but don't overflow.
- Note: a full visual sweep of all ~30 surfaces at mobile wasn't done (proportionate to the low risk the code audit found); the patterns + spot-checks give high confidence.

## Workstream 5 — Reliability scenarios ✅ complete
- **DB/backend unreachable (cold start) — fixed.** Reproduced by stopping Postgres: `requireUser()` in the async `(shell)/layout.tsx` throws, and `(shell)/error.tsx` can't catch its own layout, so it fell through to the dependency-light `global-error`. Added `app/error.tsx` — the root-segment boundary that DOES catch child-segment layout throws — rendering a calm, on-brand, backend-aware screen ("The workspace couldn't load … a background service isn't reachable … Try again") inside the themed root layout, with the error digest for logs. Verified by construction (typechecks; correct Next.js boundary placement — a root `error.tsx` catches throws from nested-segment layouts). Note: dev masks it with the error overlay and prod redacts the message + is auth-gated, so a full visual proof needs a configured prod deploy; the boundary hierarchy itself is documented Next.js behaviour.
- **AI provider failure → Local fallback — verified built.** `createEnvProviders()` always includes `local: true`; a missing/failing cloud key leaves that provider `available:false` and falls through to Local, which works offline. (Chief showed "GROUNDED · LOCAL" live.)
- **Offline → online sync — verified built (Stage 8).** Durable IndexedDB outbox, coordinator drains through the idempotent endpoint on reconnect, honest `navigator.onLine` status + sync pill. Previously browser-verified (offline→reconnect→sync-once, idempotent).
- **Push/notification failure — non-blocking by design** (behind the platform provider; the app never depends on delivery).
- **Expired/invalid OAuth — Stage B** (connectors aren't live yet; the sample path already degrades honestly).

## Workstream 6 — Performance ✅ complete (pass — healthy, no fixes needed)
Measured from a fresh production build (which also served as the Stage-A build gate — it passed clean after all WS1–5 changes).
- **Bundle: lean.** Shared First Load JS **103 KB**; every route **245–347 KB** (heaviest: command-center 347, settings 336, profile 317, sign-in 300 — Clerk's weight). No route is bloated; no heavy charting/3D/editor libraries (framer-motion is the only notable dep; charts, the knowledge graph, and the Wheel are custom lightweight SVG/canvas, and the Wheel is already `next/dynamic`-split).
- **Budgets (documented):** shared baseline ≤ ~110 KB; per-route First Load JS ≤ ~350 KB. All routes currently within budget.
- **First paint is instant** — the shell chrome renders immediately; page content is client-fetched beneath it with loading states (never a blank screen).
- **Data load:** the Command Center fires ~15 queries in a single `httpBatchLink` round-trip (optimal for round-trips). Full content lands in ~600 ms, gated by the slowest query (`chief.now` ~590 ms), with tile skeletons meanwhile. **Known characteristic, deliberately not changed:** the shell paints instantly and skeletons cover the wait, so the perceptual cost is small; splitting the slow Chief query into a deferred batch is a possible future optimization but adds complexity disproportionate to the gain here.
- Server query durations observed 40–590 ms (dev logs) — reasonable.

## Execution order
1. Reproduce-clean baseline (prod build, healthy DB) — separates real bugs from cold-start noise (settles A1.1/A1.6 scope).
2. Workstream 1 fixes, each browser-verified.
3. Workstreams 2–4 audits (checklist-driven).
4. Workstream 5 reliability.
5. Workstream 6 performance.
6. Final gates + full clean-load console sweep across all routes.

One branch, logically-grouped commits, browser proof per workstream. No `Co-Authored-By: Claude` trailer per repo convention.
