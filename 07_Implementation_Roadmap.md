# 07 — Implementation Roadmap

**Project:** My OS
**Method:** vertical stages. Every stage ends with a deployable, personally usable increment ("daily-drivable checkpoint"), its own tests green, and demo criteria met. Stage numbers are build order; a stage may start only when its listed dependencies are complete. Requirement IDs reference `02_PRD`.

Estimated effort assumes one focused developer (or AI pair); sizes: S ≈ ≤3 days, M ≈ 1 week, L ≈ 2 weeks.

---

## Stage 0 — Foundation & Walking Skeleton (L)
**Depends on:** —
**Build:** monorepo (pnpm+turbo, tsconfig, lint/format, CI pipeline); `packages/ui` with all design tokens (DRD §2) + core primitives (Button, Input, Card, Modal, Toast, ListRow, Skeleton, EmptyState, Kbd); `packages/db` with Drizzle + migration runner + seed; `packages/shared` zod bases; Next.js app shell (sidebar, top bar, responsive shell, theme switch, mobile tab bar); tRPC wiring + error mapping; auth complete (setup wizard, login, sessions, lockout, recovery key, security settings) (FR-AUTH-1..5); SSE channel scaffold; docker-compose (dev + prod), Caddy, deploy script, health endpoint; worker process skeleton with pg-boss + heartbeat; GlitchTip + pino logging.
**Demo criteria:** deploys to VPS over HTTPS; can set up account, log in/out on two devices, revoke a session; shell renders on desktop/mobile; CI green; a sample cron job runs in worker and is visible in logs.

## Stage 1 — Tasks & Areas (L)
**Depends on:** 0
**Build:** areas CRUD + seeds; tasks full model (FR-TASK-1..9 sans AI): views (Inbox/Today/Upcoming/All/saved), list+board, peek panel, subtasks, dependencies, recurrence engine (`packages/core/recurrence` + materializer job), bulk ops, undo/soft delete/trash, keyboard nav & selection (DRD §8 list keys), Quick Capture modal with NL date parsing (client parser only, Inbox default tab); **Life Inbox** (`inbox_items`, `/inbox`, capture composer + image/audio recording, organize→convert flows, PWA share target route; FR-INBOX-1..4); activity_log + domain_events outbox writing, SSE invalidation live.
**Demo criteria:** run daily task management for real; recurring task rolls over correctly across a week (fixture-tested incl. DST dates); every FR-TASK edge case has a test; `C` capture ≤3 interactions verified; share a URL from the phone → lands in Inbox → converts to a task with the link attached.

## Stage 2 — Calendar & Events (M)
**Depends on:** 1
**Build:** events CRUD, reminders config rows, RRULE recurrence + instance materializer + scope-edit flows (FR-CAL-1..5), Month/Week/Day/Agenda views with drag-create/move/resize, conflict badges, tasks-due lane.
**Demo criteria:** class-like weekly recurring event with one edited + one cancelled instance renders correctly in all views; timezone + DST golden tests pass.

## Stage 3 — Planner (deterministic) (L)
**Depends on:** 1, 2
**Build:** day_plans + time_blocks, timeline UI with dnd-kit (drag/resize/snap, lanes), Unscheduled tray, block lifecycle incl. live timer + rollover job finalization (FR-PLAN-1..6), scheduling engine in `packages/core` (§04.6) powering "Build simple schedule" (deterministic), deterministic rescue (shift-forward), day templates/copy; **Today page v1** (Morning Briefing with deterministic rows, Day/Evening modes, Now card from deterministic prioritizer; FR-DASH-1..4,7 partial, FR-DASH-11..15); **energy check-ins** (`energy_logs`, briefing selector + top-bar chip, deterministic planner/Now-card modifiers; FR-NRG-1..3); **Focus Mode v1** (`focus_sessions`, overlay, timer, interruptions, heartbeat; DND hook stubbed until Stage 4; FR-FOCUS-1..5); **DecisionCard + PageQuestion components** with deterministic fills for existing pages (FR-GLOB-5..6); **Tomorrow Studio v1** (deterministic review/sweep/design/wind-down wizard, §PRD 6.5 sans AI ordering).
**Demo criteria:** plan a real day fully manually + via deterministic generator; timer + skip/complete flows work on mobile PWA; missed blocks finalize overnight; scheduling engine passes golden-fixture suite (bounds, buffers, breaks, caps, deps, energy modifiers — low-energy fixture produces shorter blocks); briefing reads complete in ≤30s with real data; kill the browser mid-focus-session → rollover closes it at last heartbeat.

## Stage 4 — Notifications & PWA Push (L)
**Depends on:** 0 (worker), 3 (things to remind about)
**Build:** full notification engine (04 §7): scanner+dispatcher, quiet-hours + focus-hold (FR-NOTIF-9) /held/digest, dedupe, snooze, actions endpoint; web-push + VAPID; service worker (Serwist) with push handlers + offline read cache + install experience (DRD §3.4); notification settings matrix + device management; history page; event/task reminder producers.
**Demo criteria:** event reminder arrives on locked Android phone (PWA) and desktop within ±30s; "+250ml"-style action button works from the notification; quiet-hours message appears in morning digest; killing the worker for an hour then restarting delivers missed reminders once.

## Stage 5 — Habits, Routines & Health (L)
**Depends on:** 4
**Build:** habits (FR-HABIT-1..5) with streak engine + rollover; routines + planner routine blocks; health suite: workouts (library seed, templates, live logging, PRs, charts), water (+ pacing built-in automation stub → full in stage 7), sleep, weight, nutrition (FR-HLTH-1..14); Health overview; Today-briefing health rows (sleep row, workout DecisionCard with free-slot computation, rings — completes FR-DASH-3, 8 and briefing rows 2/8) + health PageQuestion (lowest-completion habit).
**Demo criteria:** two weeks of daily-driver logging works end-to-end incl. streak correctness across a skipped day and a timezone trip fixture; PR detection fires timeline-ready event; all charts render with sparse data.

## Stage 6 — Notes, Journal & Reviews (M)
**Depends on:** 1
**Build:** Tiptap editor infrastructure (shared component, image upload pipeline per 04 §10); notes (FR-NOTE-1..4,6 lexical search only), backlinks; journal (FR-JRNL-1..3,5) + heatmap; weekly planning + monthly review flows with deterministic stats compilation (18.1/18.2 minus AI narrative); life timeline page + deterministic auto-events from outbox, activity-fabric contribution heatmap, "On this day" memories card (page + briefing closer), season bands render slot (FR-LIFE-1..3, 5..6).
**Demo criteria:** write linked notes with images; journal streak + "this day last year"; complete one weekly plan and one (partial-month) review; timeline shows auto events from prior stages' data.

## Stage 7 — Automations & College/Internship (L)
**Depends on:** 4 (notifications), 2, 1
**Build:** automation engine (FR-AUTO-1..6): rule model, cron materialization, event matching, condition/action library, editor UI, run history, test-run; ship all built-ins (incl. water pacing, digests, budget hooks stubbed until stage 8); college workspace complete (FR-COLL-1..7) incl. schedule→calendar bridge and assignment→task bridge; internship workspace (FR-INTERN-1..5); **Seasons v1** (`seasons` model + presets + SeasonChip/switcher/editor + deterministic effects: prioritizer weights, planner overrides, notification profiles, pausable habits, briefing row order; FR-SEASON-1..3, 5).
**Demo criteria:** built-ins fire correctly over a 48h soak; custom rule ("if no water by 14:00 notify silently") works; loop-guard test passes; a full semester setup (5 courses, schedule, 3 assignments, 1 exam) drives planner + reminders correctly; entering "Exam week" reorders the briefing, mutes non-critical notification types, and reweights Today's task order (fixture-verified).

## Stage 8 — Finance (M)
**Depends on:** 1, 7 (for budget/renewal automations)
**Build:** FR-FIN-1..8 complete: accounts, transactions (rapid entry + keyword auto-category), categories editor, budgets + pace + threshold events, subscriptions engine (renewal job, auto-transactions, reminders), savings goals, overview dashboards, CSV export.
**Demo criteria:** one month of real spending tracked; budget 80% alert fires; subscription renewal auto-creates transaction with undo; month rollover stats correct.

## Stage 9 — Command Center & Analytics (M)
**Depends on:** content stages 1–8
**Build:** ⌘K Command Center (commands + navigation registry incl. season switch and Focus Mode), FTS columns + `search_all()` across all entity types (incl. inbox items, notifications history), results page, query filters, saved-view pinning (FR-SRCH-1..4 lexical scope); **Focus & Productivity Analytics** (`/analytics`, metric functions + formulas in `packages/core/insights`, review embeds; FR-ANLYT-1..4); PageQuestion deterministic fills wired on all remaining major pages.
**Demo criteria:** every page/entity/action reachable via ⌘K; search returns grouped results < 150ms p95 on seeded 10k-row dataset; analytics numbers match hand-computed fixtures (deep work, interruptions, planner accuracy).

## Stage 10 — AI Core: Assistant, Proposals & Planner AI (L)
**Depends on:** 9 (search), 3 (planner), 4 (notifications)
**Build:** `packages/ai` per 06: AiService, context engine builders, prompt files + caching layout, usage logging + budget guard; proposal system (`ai_actions` + ProposalCard UI + apply/rollback executors); assistant (drawer+page, streaming, tools read+propose+memory-remember, citations); PlannerAI generation/regeneration/rescue with validator + fallback (FR-PLAN-7..8, FR-DASH-7 AI path); prioritizer judgment layer (Now card); embeddings indexer + semantic search merge + related-notes (FR-SRCH-3 semantic, FR-NOTE-5); capture/expense classification via Haiku.
**Demo criteria:** the six PRD example questions (FR-AI-2) answered correctly with citations against seeded data; generated day plan passes validator 20/20 fixture days; accept/edit/reject flows atomic; unplug ANTHROPIC_API_KEY → every AI surface degrades per NFR-9; budget caps enforced in a simulated overage.

## Stage 11 — AI Everywhere & Goals (M)
**Depends on:** 10
**Build:** goals feature complete (FR-GOAL-1..4) with auto-derived progress; AI narratives: weekly digest, monthly review narrative + suggestions, timeline blurbs + year wrap; reminder intelligence (digest composer, pacing proposals, deadline-risk job); memory consolidation weekly batch + memory viewer; nightly plan pre-generation via Batch API; page-question AI copy pass + DecisionCard phrasing (06 §9); "Sort my inbox" (FR-INBOX-5); season-aware AI behaviors (FR-SEASON-4, `propose_season`); remaining [AI] task/college features (break-down, estimates, revision plans, find-me-a-slot, brain-dump extraction, internship weekly summary).
**Demo criteria:** Sunday flow: pre-generated Monday draft + weekly plan with AI narrative + ≥1 sensible suggestion; memory added via chat visibly influences next plan; batch jobs show 50% pricing in usage log.

## Stage 12 — Data, Backups & Hardening (M)
**Depends on:** all
**Build:** export/import per FR-DATA-1..2 (JSON round-trip + CSV mapping UI + dry-run); backup pipeline + verify-restore + restore runbook & in-app restore (FR-DATA-3..5); retention/purge jobs (05 §17); settings completion pass; performance pass (EXPLAIN review, virtualization audit, bundle budget, NFR-1/2/5 measured); accessibility pass (DRD §10 checklist); security pass (headers, rate limits, dependency audit); failure-mode drills (04 §13 each row exercised); docs sync.
**Demo criteria:** full export → wipe dev DB → import → byte-equivalent re-export; nightly backup verified restore green; Lighthouse PWA ≥ 90, a11y ≥ 95; all NFRs measured and recorded in `infra/runbooks/benchmarks.md`.

## Stage 13 — Polish & V1 Ship (S–M)
**Depends on:** 12
**Build:** motion/micro-interaction pass per DRD §9; empty states/copy pass; onboarding checklist card; shortcut help overlay; icon/splash final; bug-bash of two full weeks of dogfooding; tag `v1.0.0`.
**Demo criteria:** 14 consecutive days of real daily-driver use with zero data loss, no P0/P1 bugs open, and the owner answers "what should I be doing right now?" from the app every day.

---

## Cross-stage rules

1. **Definition of Done (every stage):** migrations reversible; unit + integration tests for new core logic; e2e happy path (Playwright) for new pages; seed data extended; deployed to VPS and used personally ≥2 days; docs updated (08 §Documentation).
2. **Testing pyramid targets:** `packages/core` ≥ 90% branch coverage (pure logic: recurrence, scheduling, streaks, budgets, automations); API integration tests against real Postgres (testcontainers); minimal but real e2e per feature.
3. **Feature flags:** stages 10–11 ship behind `AI_ENABLED` env flag so earlier stages remain daily-drivable during AI development.
4. **No stage skipping for shiny reasons.** The dependency graph exists because notifications need targets (3→4), automations need notifications (4→7), AI needs data + search + proposals substrate (…→10).
