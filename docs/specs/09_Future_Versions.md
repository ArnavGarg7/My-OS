# 09 — Future Versions

**Project:** My OS
**Purpose:** ideas deliberately excluded from Version 1 (see `01_Vision §5 Non-Goals`). Each entry records why it was deferred and what V1 groundwork already anticipates it. Nothing here may be built before V1 Stage 13 ships.

---

## V1.x — Near-term enhancements (post-ship polish tier)

| Idea | Why deferred | V1 groundwork |
|---|---|---|
| **Real weather in the Morning Briefing** | Trivial but external dependency; zero impact on core loop | Weather row exists as placeholder component with a documented data-slot API |
| **Offline write queue** (PWA) | Sync/conflict complexity not worth it before habits are proven | Mutations centralized in `lib/mutations`; SSE invalidation makes reconciliation feasible |
| **Pomodoro mode** on focus blocks | Timer exists; cycles/auto-breaks are additive | Block timer + break blocks already modeled |
| **Note version history** | Editor + storage cost; journal/notes are low-conflict solo | Tiptap JSON snapshots trivially storable in a `note_revisions` table |
| **Custom day templates library** (multiple named templates, weekday defaults) | V1 has copy-day + one template path | `day_plans`/`time_blocks` shapes support it |
| **Widgets** (Android PWA shortcuts/badges, desktop mini-window) | Platform-specific effort | PWA shortcuts already defined in manifest |
| **CSV import expansion packs** (bank-statement presets for common Indian banks) | Mapping UI exists; presets are content work | Import mapping persistence (`import_jobs.mapping`) |

## V2 — Integrations (breaks the "no external data" boundary)

| Idea | Notes |
|---|---|
| **Google Calendar two-way sync** | Biggest requested bridge; requires OAuth infra, sync-token diffing, conflict policy. `events.source_type/source_id` columns and instance model were designed with an external-source slot in mind |
| **Wearable/health sync** (Apple Health via shortcut export, Google Fit, Fitbit) | Would replace manual sleep/weight/steps entry; canonical-metric storage (kg/ml/minutes) is already vendor-neutral |
| **Bank/UPI ingestion** (statement email parsing or account aggregator APIs) | Highest-value finance upgrade; V1 keyword auto-categorization becomes training data |
| **Email/message capture** ("forward to My OS" → inbox task) | Introduces prompt-injection surface — requires the sanitization layer noted in 06 §15 |
| **Weather-aware planning** | Planner constraint slot ("outdoor blocks need weather ok") reserved in scheduling-engine config |
| **Canvas/LMS sync** for assignments | Assignment→task bridge already exists; source columns ready |

## V2 — AI deepening

| Idea | Notes |
|---|---|
| **Voice interface** (STT capture + assistant, TTS) | Whisper-class STT + TTS; V1's Life Inbox already stores raw voice memos — transcribing those into text/tasks is the natural first step; Quick Capture parsing pipeline is reusable as-is |
| **Proactive assistant** (initiates: "you have 40 free minutes — Physics revision?") | Needs interruption-budget model on top of notification engine; reminder-intelligence pacing data (acted/ignored rates) is the training signal |
| **Weekly auto-planning** (AI drafts the whole week, not just days) | Extends PlannerAI schema from day to week horizon |
| **Natural-language automations** ("remind me to stretch every hour I'm at my desk" → rule draft) | Automation JSONB rule format was kept LLM-writable on purpose |
| **Photo food logging** (vision-model calorie/macro estimation) | Meal-log snapshot model unchanged; adds a vision call |
| **Local model option** (Ollama adapter) for `local_only` mode with degraded quality instead of disabled AI | `AiService` interface is the seam |
| **Semantic life search** ("that week I felt great — what was I doing?") | Journal + timeline + metrics correlation queries over existing embeddings |
| **Managed agent for heavy jobs** (year-wrap, large imports summarization via Anthropic Managed Agents) | Only if batch jobs outgrow the worker |

## V2 — Life-domain expansions

| Idea | Notes |
|---|---|
| **Reading tracker** (books, progress, highlights) | Fits area+goal+habit primitives; likely a template pack rather than new tables |
| **Learning/spaced repetition** (flashcards for exam syllabus items) | Exam syllabus checklist is the seed |
| **People CRM** (birthdays, last-contacted, gift ideas) | New domain; timeline + reminders reuse |
| **Travel mode** (trip planner, packing lists, per-trip budget) | Areas + projects + checklists cover 70% today |
| **Meal planning** (weekly menu → nutrition targets → shopping list) | Foods library is the seed |
| **Documents vault** (IDs, certificates with expiry reminders) | Files table + notification engine reuse; needs encryption story first |
| **Net-worth tracking** (investments, assets, liabilities) | Accounts model extends; needs valuation snapshots table |

## V3 — Platform maturity

| Idea | Notes |
|---|---|
| **Native mobile app** (Expo/React Native or Capacitor wrapper) | Only if PWA notification/UX limits (esp. iOS) prove painful in practice |
| **Multi-user support** (partner/family shared spaces) | Would require `user_id` columns + RLS everywhere (deliberately noted in 05 §0), shared-entity permissions, and rethinking "single user" assumptions in caching and settings — a major version, not a feature |
| **Public API / webhooks out** | For personal scripting (e.g., Home Assistant); tRPC contract would gain a stable REST facade |
| **Plugin/extension system** | Automation actions as the plugin surface |
| **End-to-end encryption at field level** for journal | Key management UX is the hard part |
| **Self-hosted LLM inference server** | Cost/privacy play once local models close the gap |
| **Data science notebook view** (SQL/chart playground over own data) | Read-only replica + saved queries |

## Parking lot (unvalidated sparks)

Mood-aware planning intensity · In-app focus soundtrack (beyond V1's music-URL shortcut in Focus Mode) · Streak freeze tokens (gamification) · Annual printed yearbook export (PDF of timeline + best journal entries) · Location-based reminders · Screen-time ingestion as an attention metric · Finer-grained energy tracking (multiple 1–5 pings/day vs V1's single Low/Med/High check-in, auto-correlated against sleep/food/exercise) · Automatic season detection (propose "exam week?" from calendar density instead of waiting for the user to declare) · Shared read-only "now page" for accountability partner.

---

### Rule for promoting an idea out of this document

An idea graduates only when: (1) V1 usage shows a real recurring pain it solves, felt ≥ weekly for a month; (2) it gets a one-page ADR (problem, evidence, design sketch, cost); (3) it does not compromise the answer-speed of "what should I be doing right now?" — the north star outranks every feature on this list.
