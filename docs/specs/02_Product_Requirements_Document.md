# 02 — Product Requirements Document (PRD)

**Project:** My OS
**Version:** 1.0 (defines everything in scope for V1)
**Related docs:** UI details → `03_DRD`; technical realization → `04_Architecture`; data shapes → `05_Database_Design`; AI behavior → `06_AI_Architecture`.

Requirement IDs are stable and referenced from the roadmap and tests. Format: `FR-<AREA>-<n>`. Anything marked **[AI]** requires the AI layer; everything else must work with AI disabled.

---

## 1. Scope & Platform

- **Users:** exactly one (the owner). No registration, no roles.
- **Clients:** desktop web (primary), installable PWA on mobile (secondary). Same codebase, responsive.
- **Connectivity:** online required for writes. PWA caches shell + last-loaded data for read-only viewing offline; any write attempt while offline shows a "You're offline" toast and is not queued (V1).
- **Time:** all timestamps stored UTC; all display/logic in the user's configured timezone (default `Asia/Kolkata`). "A day" is midnight-to-midnight in user TZ. Changing timezone in settings re-renders all views; historical logs keep their original wall-clock day via a stored `local_date` where day-bucketing matters (sleep, habits, journal, water).

## 2. Global Concepts

### 2.1 Areas (life areas)
Every content entity (task, project, note, event, goal) can belong to one **Area**: `Personal`, `College`, `Internship`, `Health`, `Finance` (seeded; user can add/rename/archive; each has name, color, icon). Areas drive filtering, workspace pages, and AI context ("College work due this week").

### 2.2 The proposal model (AI write-safety)
- **[AI]** Any AI-generated change to user data is created as a **Proposal** (`ai_actions` table): a typed payload (e.g., "create 3 tasks", "day plan draft", "reschedule block").
- Proposals render as cards with **Accept / Edit / Reject** (accept-all supported for batches). Accepting applies the change transactionally and stamps the created rows with `origin='ai'`.
- Auto-write is allowed only for: AI summaries, embeddings, priority scores, and life-timeline auto events. These are derived/annotative and never destroy user input.
- Proposals expire after 7 days (auto-reject, kept in history).

### 2.3 Quick Capture
- Global shortcut `C` (desktop) and a floating `+` button (mobile) open the **Quick Capture** modal from any screen.
- One text field with natural-language parsing (client-side chrono-style parsing; **[AI]** fallback for ambiguous input): `"submit lab report tue 5pm #college !p1 ~45m"` → task with due date, area, priority, estimate.
- Tabs inside modal: **Inbox (default — anything, §4A)** · Task · Note · Event · Expense · Water (+250ml one-tap) · Weight · Journal line. The parser auto-switches to the Task tab when it detects task syntax (date/priority/estimate markers); one keystroke overrides.
- Requirement: ≤ 3 interactions from anywhere to a saved item (FR-GLOB-1).
- If parsing is uncertain, the parsed interpretation is shown as removable chips before save — never silently guessed wrong.

### 2.4 Undo
- Every destructive or bulk action (delete, complete-all, accept plan, archive) shows an 8-second toast with **Undo**. Deletes are soft (`deleted_at`) for all user content; a Trash view under Settings → Data allows restore within 30 days, then hard-purged by a nightly job (FR-GLOB-2).

### 2.5 Recurrence
- Events, tasks, habits, routines, and automations may recur. Recurrence uses **RFC 5545 RRULE** strings plus `exdates` (skipped instances) and `overrides` (edited single instances). UI exposes presets (daily, weekdays, weekly on \[days], monthly on \[day/nth weekday], yearly, custom interval) — raw RRULE editing is not exposed in V1.
- Editing a recurring item always asks: **This occurrence / This and future / All occurrences** (FR-GLOB-3).

### 2.6 Origin & audit
- Every content row carries `origin` (`user` | `ai` | `automation` | `import` | `system`).
- An append-only `activity_log` records create/update/complete/delete on core entities. It powers "When did I last work on X?", the Life Timeline auto-events, and monthly reviews (FR-GLOB-4).

### 2.7 Decision-first surfaces
My OS is **decision-driven, not information-driven** (FR-GLOB-5):
- Every count/stat/alert ships with its decision attached, rendered as a **DecisionCard** (DRD §4.6): "8 overdue" → `Finish 3 · Ignore 5` (opens triage); "no workout yet" → `Workout now? 45 min free before Physics` (computed from actual free time); "Food budget 92%" → `Freeze eating out? 9 days left`.
- Decision copy grammar (mandatory): situation (one line) → recommended action (verb-first button) → ≤2 alternatives → cost of ignoring (caption). Dismissing a DecisionCard is itself a logged decision.
- Never more than 2 DecisionCards stacked on a view; overflow collapses into "n more decisions".
- **FR-GLOB-6 Page questions:** every major page carries a pinned **page-question slot** that answers its question in one line (deterministic fill; AI-polished copy when available — see `06_AI §9`):

| Page | Question it must answer |
|---|---|
| Today | What should I do next? |
| Planner | What's the best use of my remaining time? |
| Projects | What's blocking progress? |
| Health | Which one habit should I improve today? |
| Finance | Where am I overspending this month? |
| Journal | What patterns are emerging? |
| Timeline | What have I accomplished recently? |

---

## 3. Authentication & Session (AUTH)

- **FR-AUTH-1** First run: setup wizard creates the single user (name, email, password, timezone, day boundaries: wake ~07:00 / sleep ~23:30, week start Monday).
- **FR-AUTH-2** Login: email (prefilled) + password. Argon2id hashing. Optional "remember this device" (session 90 days; otherwise 7 days). Sessions are DB-backed, revocable in Settings → Security ("Sign out other devices").
- **FR-AUTH-3** Rate limiting: 5 failed attempts → 60s lockout, exponential up to 15 min. All attempts logged.
- **FR-AUTH-4** Password change requires current password. Password reset (no email infra): a one-time recovery key generated at setup, shown once, required for reset from the login screen.
- **FR-AUTH-5** Auto-lock (optional): require re-auth after N minutes idle (off / 15m / 1h / 8h). PWA supports biometric unlock via WebAuthn as a convenience *in addition to* the session cookie.
- **Edge cases:** expired session mid-action → modal re-login preserving unsaved form state; clock skew tolerated ±5 min; recovery key lost + password lost → documented CLI reset procedure on the server (see `08_Developer_Guidelines.md`).

---

## 4. Today — the time-aware home (TODAY)

Route `/`, named **Today** everywhere (nav, page title, PWA shortcut) — because nobody thinks "I'll open Home"; they think "what does today look like?". One page, three modes selected by current time vs. user's day boundaries (manual override via segmented control):

| Mode | Window | Character |
|---|---|---|
| **Morning Briefing** | wake → 11:00 | Mission control — read once top-to-bottom, know the whole day |
| **Day** | 11:00 → 20:00 | Now/Next execution, progress |
| **Evening** | 20:00 → sleep | Review, journal, **Tomorrow Studio** entry |

### 4.1 Shared elements (all modes)
- **FR-DASH-1 "Now" card** (hero): the single most important thing right now — the active time block if one is running (with elapsed/remaining, Done/Extend/Skip actions); otherwise the top-priority actionable task, phrased as a decision with its reason ("Suggested now: Physics lab — due tomorrow, you're free until 16:00", with Start (creates a block), Snooze, Not this). Logic in `06_AI_Architecture §Prioritizer`; deterministic fallback = urgency score without LLM.
- **FR-DASH-2 "Next up" list**: next 3 blocks/events with times.
- **FR-DASH-3 Progress strip**: day completion (blocks done/total), habit ring, water ring, tasks-done count.
- **FR-DASH-4** Every card deep-links to its feature page; every metric is tappable to log (water ring → +glass).

### 4.2 Morning Briefing
**Not a widget grid — a briefing.** A single readable column ordered like a mission run-through; each row is one sentence plus at most one decision (DRD §5.1); rows without data auto-collapse. Fixed order (season config may reorder, §17A):

1. **Greeting + date** — "Good morning, Arnav" (FR-DASH-5).
2. **Sleep** — last night: "6h 40m, quality 3/5 — 50m below target"; one-tap correct/log (FR-DASH-11).
3. **Energy check-in** — Low / Medium / High selector (§4B); the row persists until answered and immediately re-tunes the planner and Now card (FR-DASH-12).
4. **Today's Mission** — the single most important outcome today (from Tomorrow Studio's #1 priority, else prioritizer #1), written as a mission line: "Ship the DBMS assignment — 2h, due 23:59." Priorities #2–3 collapsed beneath (FR-DASH-6).
5. **Focus Score** — yesterday's deep-work hours vs 7-day average + today's planned focus hours: "Yesterday 2.1h deep (avg 2.8) · 3h planned today" (FR-DASH-13, formulas in §18A).
6. **Deadlines** — everything due ≤48h (tasks, assignments, exams) with countdowns; unscheduled ones get a `Plan it` action.
7. **Meetings & classes** — today's fixed events with times/rooms; next one highlighted.
8. **Workout** — decision-framed per FR-GLOB-5: planned workout with `Start · Move · Skip`, or "Workout now? 45 min free at 18:00" when unplanned.
9. **Weather** — placeholder row (mock data + documented API slot; live data is V2).
10. **Yesterday's unfinished** — triage DecisionCard: `Finish today (3) · Move (2) · Ignore (4)` → one-screen sweep (same component as Tomorrow Studio step 2) (FR-DASH-14).
11. **Notifications** — anything held overnight by quiet hours, as an inline digest row.
12. **Today's AI recommendation [AI]** (FR-DASH-7): no plan → "Generate today's plan" CTA with a one-line preview of what it would prioritize; overnight pre-generated draft ready → "Your draft is ready — accept?"; plan accepted → the one adjustment the AI would make, if any (season-aware, §17A). Deterministic fallback: plan-state CTA only.
13. **Closer** — streak fact / memories card when one exists (§22 FR-LIFE-6) / optional daily quote (Settings toggle) (FR-DASH-8).

- **FR-DASH-15** The briefing is read-complete in ≤30 seconds; a "Start my day →" button at the end collapses it into Day mode.

### 4.3 Day mode
Now card grows (active-block timer ring), Next-up list, progress strip pinned under the top bar. Contextual DecisionCards (max 2) surface between Now and Next: free-time gap ("40 free minutes before Standup — knock out 2 admin tasks?"), at-risk deadline, behind-pace water.

### 4.4 Evening mode
- **FR-DASH-9 Day review card**: blocks completed/skipped, tasks done, habits status → one-tap "looks right" or corrections.
- **FR-DASH-10 Tomorrow Studio entry**: "Design tomorrow" CTA → §6.5. Journal CTA with today's mood quick-pick. Sleep reminder countdown ("Wind-down in 40m").
- **Edge cases:** empty everything (first day) → onboarding checklist card; overdue pile > 10 → standard triage DecisionCard; after midnight but awake → stays in Evening mode until sleep-time + 3h, then rolls to the new day; briefing opened after 11:00 → collapsed with "review briefing" link.

## 4A. Life Inbox (INBOX)

Route `/inbox`. A universal capture drawer for **everything that has no home yet** — ideas, screenshots, voice notes, random thoughts, articles, shopping items, receipts. Capture now, organize later. Upstream of tasks; the antidote to "where do I put this?".

- **FR-INBOX-1 Item kinds**: text (thought/idea), link (URL; title+favicon fetched, no further scraping in V1), image/screenshot (paste, share, upload), voice memo (in-browser audio recording, playable; **no transcription in V1** — see 09), receipt (image + optional amount shortcut that pre-fills the expense conversion).
- **FR-INBOX-2 Ways in**: Quick Capture default tab (`C`); **PWA share target** (share any URL/image/text from the phone → lands in Inbox); paste anywhere on `/inbox`; drag-drop files.
- **FR-INBOX-3 Processing**: every item has `Organize` → convert to Task / Note / Event / Expense / Project idea / Timeline memory — the target's create-form opens pre-filled from the item; on save the item is marked `processed` with a link to what it became. Alternatives: Archive, Delete.
- **FR-INBOX-4 Inbox-zero mechanics**: unprocessed count badge in the sidebar; Tomorrow Studio step 2 and weekly planning include an "Inbox sweep" step when count > 10; items older than 30 days get a stale tint + "still needed?" caption.
- **FR-INBOX-5 [AI] "Sort my inbox"**: batch proposal classifying items into suggested conversions (task/note/expense/idea) with pre-filled fields — accept per item or all (§2.2).
- **Edge cases:** audio capped 5 min / 20MB; share-target while logged out → login → land back on capture; converting an image to an expense keeps the image attached to the transaction; deleting an inbox item never touches entities it already became.

## 4B. Energy Check-ins (NRG)

Energy is **not** a health metric — it's a subjective Low / Medium / High signal the whole system plans around.

- **FR-NRG-1** The Morning Briefing asks once daily (skippable; re-asked once at midday if skipped). Re-log anytime via the energy chip in the top bar.
- **FR-NRG-2 Deterministic effects, immediate:** **Low** → planner shrinks deep-work blocks (≤45m), adds extra breaks, defers `deep`-energy tasks not due soon, Now card prefers `light/admin` tasks, workout nudges soften ("Light walk instead?"). **High** → offers +1h deep-work cap, pulls the hardest task into the peak window. **Medium** → defaults.
- **FR-NRG-3** Logged to `energy_logs`; charted in Analytics (§18A); weekly review overlays energy against sleep duration (deterministic correlation, no LLM math).
- **FR-NRG-4 [AI]** Today's energy is always in AI context; planner and assistant must respect and reference it ("You said low energy — keeping the afternoon light").

---

## 5. Tasks (TASK)

Route `/tasks`. Views: **Inbox** (no date/project), **Today**, **Upcoming** (7-day + later), **All**, per-Area, per-Project. List and board (by status) layouts.

### 5.1 Model
Fields: title, description (rich text), status (`inbox·todo·in_progress·done·cancelled`), priority (P0 urgent / P1 high / P2 normal / P3 low, default P2), due_at (date or datetime), scheduled_date (the day I intend to do it — distinct from due), estimate_minutes, actual_minutes (accumulated from planner blocks), energy (`deep·light·admin`), area, project, parent_task (subtasks, one level), tags (free-form), recurrence, blocked_by (task refs), origin.

### 5.2 Requirements
- **FR-TASK-1** Create: quick capture (§2.3), inline "+" row in any list, from AI proposals, from templates (assignment auto-tasks §9). Title only is enough; everything else optional.
- **FR-TASK-2** Complete with `X`/checkbox → satisfying check animation, moves to Done, records `completed_at`, increments streak/timeline events. Undo toast.
- **FR-TASK-3** Recurring tasks: on completion, next instance materializes per RRULE (due-date-based, not completion-based, with a "roll forward from completion" toggle per task).
- **FR-TASK-4** Subtasks: checklist under parent; parent shows n/m; completing all subtasks prompts (never auto-completes) parent completion.
- **FR-TASK-5** Dependencies: a task with incomplete `blocked_by` shows a blocked badge and is excluded from "suggested now" and auto-planning; completing the blocker notifies ("'Design schema' is unblocked").
- **FR-TASK-6** Overdue: due_at past & not done → red badge, sorts to top of Today view, feeds the yesterday's-unfinished triage DecisionCard (§4.2), included in AI overdue answers. Overdue recurring tasks never stack more than 1 pending instance.
- **FR-TASK-7** Bulk ops: multi-select (shift-click / long-press) → complete, move date, set priority, set project, delete.
- **FR-TASK-8** Task detail opens as right-side peek panel (list context preserved); full page for deep editing. Shows linked notes, planner history ("worked 3 blocks · 2h 10m total"), activity.
- **FR-TASK-9** Sorting: manual (persisted per view) or by priority/due/created. Filtering by any field combination; filters shareable as saved views (pinned to sidebar).
- **FR-TASK-10 [AI]** "Break this down": generates proposed subtasks with estimates. "Estimate": proposes estimate_minutes from similar past tasks.
- **Edge cases:** due in past on create → allowed with warning chip; circular dependency → rejected with explanation; deleting parent → children promoted to top level (asked first); completing a blocked task manually → allowed (dependency is advisory); 10k+ tasks → views paginate/virtualize, search stays indexed.

---

## 6. Planner — Daily Timeline & Smart Scheduling (PLAN)

Route `/planner`. The heart of the product. A vertical day timeline (05:00–02:00 visible range, auto-scrolled to now) containing **time blocks**.

### 6.1 Time blocks
Types: `task` (linked task), `event` (mirror of calendar event, read-only here), `focus` (deep work container, optionally multi-task), `break`, `routine` (linked routine), `buffer`, `custom`. Fields: title, start, end, type, links, status (`planned·active·done·skipped`), actual_start/actual_end, notes.

- **FR-PLAN-1** Grid snaps to 5 minutes; default block 30m; min 10m.
- **FR-PLAN-2** Drag to move, drag edges to resize, drag task from the right-hand "Unscheduled" tray onto the timeline to schedule it (sets block + task.scheduled_date). Keyboard: arrows move selection, `alt+↑/↓` nudge 15m.
- **FR-PLAN-3** Overlaps allowed but visually flagged (side-by-side lanes like calendars); events are immovable from planner (edit in calendar).
- **FR-PLAN-4** Block lifecycle: **Start** (from block, Now card, or notification action) → active, live timer; **Complete** → done, logs actual duration onto linked task; **Skip** → skipped with reason chip (no time / not needed / did something else); untouched past blocks auto-mark `missed` at day end (a skipped subtype) during the nightly rollover job.
- **FR-PLAN-5** Day plan states: `none → draft → accepted → (live edits) → reviewed`. Only one plan per date. Draft plans (AI-proposed) are visually distinct (dashed) until accepted.

### 6.2 Manual planning
- **FR-PLAN-6** Full manual capability: create/edit/delete any block without AI. Templates: "Copy yesterday", "Copy last Monday", apply a saved day template.

### 6.3 Constraints the scheduler must respect (both AI & deterministic)
Wake/sleep boundaries; fixed events & class schedule; routines pinned to their times; task due dates & dependencies; estimates; energy matching (deep work in user-configured peak hours, default 09:00–13:00); max continuous focus (default 90m) followed by a break (default 15m); buffer (default 10m) before/after events; lunch/dinner windows; daily deep-work cap (default 4h); **today's energy check-in** (§4B modifiers on block length, breaks, and task selection); **active season config** (§17A — weight overrides, protected blocks, adjusted caps). All defaults editable in Settings → Planning.

### 6.4 AI plan generation **[AI]**
Trigger: Today-page CTA, planner "Generate" button, Tomorrow Studio, or nightly pre-generation job (03:30, produces a draft).
Flow: gather context (see `06_AI` §Context Engine) → produce draft plan (blocks + per-block rationale + list of tasks that did *not* fit with reasons) → user reviews draft overlay → **Accept all / drag-edit then accept / regenerate with instruction** ("more breaks", "keep afternoon free" — free-text steering) → accepted plan becomes the day plan.
- **FR-PLAN-7** Generation p95 < 15s with skeleton progress UI; failure → toast + deterministic fallback offer ("Build a simple schedule without AI").
- **FR-PLAN-8** Every generated block carries `rationale` shown on hover/tap.

### 6.5 Tomorrow Studio (night planning)
**The place where tomorrow gets created.** Guided 4-step full-screen studio (evening Today CTA "Design tomorrow" or 21:30 notification):
1. **Review today** — auto-summary of blocks/tasks/habits; mark corrections.
2. **Sweep** — unfinished tasks: finish tomorrow / backlog / drop (bulk gestures); includes an Inbox sweep step when unprocessed items > 10 (§4A FR-INBOX-4).
3. **Design tomorrow** — pick top 3 priorities (#1 becomes tomorrow's **Mission**, §4.2; AI-suggested order **[AI]**), confirm fixed events, generate or hand-build tomorrow's draft plan; season-entry prompt when a preset trigger is near (§17A FR-SEASON-1).
4. **Wind down** — journal shortcut, sleep reminder confirmation.
Completing the flow stamps `day_plans.planned_night_before = true` (a tracked metric).

### 6.6 Replanning ("Rescue my day") **[AI]**
Button appears when ≥ 2 blocks are missed or a new event conflicts with the plan. Regenerates only the remaining hours, preserving completed/active blocks; same accept flow. Deterministic fallback: shift remaining blocks forward, dropping lowest-priority to the Unscheduled tray with a summary of what fell off.

- **Edge cases:** planning a past date → allowed (retro-logging) but no notifications; DST/timezone change day → blocks keep wall-clock times; task deleted while scheduled → its blocks become `custom` stubs flagged "task removed"; two devices editing same plan → last-write-wins per block + realtime refresh (§04 Architecture, SSE); block spanning midnight → belongs to start-date's plan, allowed until 02:00 only.

## 6A. Focus Mode (FOCUS)

Press `F` (or Start on any task/block) → **the entire UI disappears.** One screen, one task. Mission control's quiet room.

- **FR-FOCUS-1 Contents (nothing else):** current task title; timer (block time-remaining ring, or count-up when unbound); the task's subtask checklist; a minimal notes strip (scratch text, saved to the session); a music shortcut (user-configured URL — Spotify/YouTube playlist — opens in a new tab); quiet controls: pause, +10m, "I got interrupted", complete, exit (`Esc`).
- **FR-FOCUS-2 Sessions:** entering starts/attaches a `focus_sessions` row (started_at, linked task/block, planned minutes). Completing/exiting closes it and writes actual focused minutes to the linked task and block.
- **FR-FOCUS-3 Do Not Disturb:** while a session is active, all notifications except `critical` are **held** and delivered as a mini digest on exit (see FR-NOTIF-9). OS-level DND remains the user's job; My OS itself goes silent.
- **FR-FOCUS-4 Interruption logging:** tab/app hidden >60s, pause, or the "I got interrupted" button increments the session's interruption count (optional one-word reason) — feeds Analytics §18A.
- **FR-FOCUS-5 End summary** (small, skippable): focused minutes, interruptions, "mark task done?".
- **Edge cases:** browser killed mid-session → session auto-closed at last heartbeat +1m by the rollover job; back-to-back sessions on the same block merge; mobile PWA uses fullscreen + screen wake-lock where supported; timer reaching zero never auto-exits (offers Done / +10m).

---

## 7. Smart Calendar & Events (CAL)

Route `/calendar`. Month / Week / Day / Agenda views. Sources rendered together, color-coded: events, class schedule (college), task due dates (chips), habit slots (optional overlay), day-plan blocks (optional overlay in Day view).

- **FR-CAL-1** Event fields: title, start/end or all-day, location, notes, area, recurrence, reminders (multiple: at time, 5/15/30m, 1/2h, 1d before, custom), attendees (free text, optional).
- **FR-CAL-2** Create: click/drag empty slot, `E` shortcut, quick capture, AI proposal. Edit: drag/resize in Week/Day; recurring-edit scope prompt (§2.5).
- **FR-CAL-3** Recurring events materialized 12 months ahead by a worker job; infinite rules re-extended monthly (see `04_Architecture §Scheduling`).
- **FR-CAL-4** Conflict detection: overlapping events show a warning badge at creation ("Overlaps 'Team standup'"); never blocks saving.
- **FR-CAL-5** Agenda view = keyboard-friendly linear list (mobile default).
- **FR-CAL-6 [AI]** "Find me a slot": natural language ("90 minutes for the ML assignment this week, mornings preferred") → 3 proposed slots ranked, one-tap creates block/event.
- **Edge cases:** event with end < start → rejected inline; deleting a series with edited instances → confirm dialog listing overrides that will be lost; all-day events sort atop day cells; imports with unknown TZ → assumed user TZ with an import warning row.

---

## 8. Projects (PROJ)

Route `/projects` (gallery grouped by area, cards show progress ring, deadline, blocker badge) and `/projects/[id]`.

### 8.1 Project detail — always-visible rail + tabs

**FR-PROJ-4 Pinned header rail** — visible on every tab, answering "what's the state of this project?" at a glance:
- **Current Focus** — one line: what I'm pushing on right now (inline-editable; staleness dot when untouched 7d);
- **Current Blocker** — prominent amber field when set, "No blocker 🎉" otherwise;
- **Next Milestone** — first undone milestone + target-date countdown (tap → Milestones tab).

Tabs:
1. **Overview**: description; **goal statement** ("done means…"); deadline; status (`active·paused·done·archived`); progress (auto = weighted done tasks+milestones, manual override slider); links to Resources; recent activity.
2. **Tasks**: embedded task board/list filtered to project; milestone grouping.
3. **Milestones**: ordered checkpoints (title, target date, done). Milestone completion → life-timeline event.
4. **Notes**: notes linked to the project (inline editor, §11).
5. **Resources**: typed link list (URL, note ref, file-less in V1 — just links) with titles and favicons.
6. **Brain Dump**: a single always-editable freeform note per project — zero-structure, append-forever capture; **[AI]** "Extract tasks" turns selected lines into task proposals.
7. **Scratchpad**: a second freeform doc for *today's working memory* on the project — meant to be messy and overwritten (distinct from Brain Dump's archival character).
8. **Ideas & Parking Lot**: two lightweight lists — **Ideas** (things this project *could* do; one-tap promote → task/milestone) and **Parking Lot** (explicitly deferred items with optional revisit date; when the date arrives it resurfaces as a DecisionCard: "Parked 3 weeks ago — revive or drop?").

- **FR-PROJ-1** Project health chip, deterministic: `on_track` / `at_risk` (deadline < 14d & progress < 60%, or blocker set & untouched 7d) / `stalled` (no activity 14d). **[AI]** weekly one-line status summaries.
- **FR-PROJ-2** Archived projects hidden everywhere by default; searchable; restorable.
- **FR-PROJ-3** "When did I last work on this?" surfaced on card (from activity_log).
- **Edge cases:** deleting a project with tasks → choose: move tasks to area backlog or delete together (explicit); >50 projects → gallery virtualization + search; circular note↔project links fine (graph, not tree).

---

## 9. College Workspace (COLL)

Route `/college`. A purpose-built area dashboard.

- **FR-COLL-1 Semesters**: name, start/end dates; one active. Switching semester archives class schedule but keeps history.
- **FR-COLL-2 Courses**: code, name, color, instructor, credits, target grade. Course page shows assignments, exams, sessions, notes, attendance %.
- **FR-COLL-3 Class schedule**: weekly recurring sessions (course, day, start/end, room) rendered into calendar & planner automatically as immovable events. Cancel-single-session supported (exdate). Optional attendance tracking per session (attended / missed / cancelled) with per-course attendance %.
- **FR-COLL-4 Assignments**: title, course, due datetime, effort estimate, status, grade received (optional). Creating an assignment auto-creates a linked task (origin=`system`) that inherits due date; completing either completes both. **[AI]** auto-plan proposal: work blocks backward from due date based on estimate.
- **FR-COLL-5 Exams**: title, course, datetime, location, syllabus checklist (list of topic strings with checkboxes), target/received grade. Exam creation → auto reminders (7d, 1d, 2h — editable) and **[AI]** proposed revision blocks across preceding days.
- **FR-COLL-6 Grades**: per-assignment/exam grade entry; simple per-course average vs. target; no GPA formula engine in V1 (manual course grade field).
- **FR-COLL-7 Workspace dashboard**: next class (with room), due this week, upcoming exams countdown, attendance warnings (<75%), at-risk courses.
- **Edge cases:** semester overlap → warned, allowed; assignment due after semester end → warning chip; deleting a course → cascades assignments/exams/sessions after explicit confirm with counts.

## 10. Internship Workspace (INTERN)

Route `/internship`. Lighter than college: it's a specialized dashboard over standard entities plus a daily log.

- **FR-INTERN-1 Profile card**: company, role, manager, start/end dates, days-per-week schedule (drives planner default "at work" blocks).
- **FR-INTERN-2 Daily work log**: one entry per workday — what I did (bullets), learnings, hours. 17:30 workday notification prompts it. Feeds weekly summary **[AI]** ("for standups/reports").
- **FR-INTERN-3 Work items**: tasks with area=Internship get an extra optional `ticket_ref` text field (e.g., "JIRA-142") shown as a chip.
- **FR-INTERN-4 Meetings**: events with area=Internship listed on the workspace dashboard with pre-meeting reminder defaults (10m).
- **FR-INTERN-5 Learnings list**: dedicated feed of log learnings + notes tagged `learning`, exportable.
- **Edge cases:** internship ended (end date past) → workspace switches to read-only summary mode with "archive workspace" CTA.

---

## 11. Notes (NOTE)

Route `/notes`. A flat, fast, linkable notebook — not a PKM behemoth.

- **FR-NOTE-1** Editor: block-based rich text (headings, lists, todo-items, quotes, code blocks with syntax highlight, dividers, images via paste/upload, tables minimal). Markdown shortcuts (`# `, `- `, `[] `, ```` ``` ````). Autosave 1s debounce with saved-state indicator.
- **FR-NOTE-2** Organization: area, optional project link, tags, pin, favorite. No folders in V1 — filters + search instead.
- **FR-NOTE-3** Wiki links: `[[Note title]]` autocompletes; backlinks panel on every note. Links to tasks/projects via `@` mention (renders live status chip).
- **FR-NOTE-4** Note list: virtualized, sorted by updated; grid or list; hover preview.
- **FR-NOTE-5 [AI]**: summarize note; extract tasks (proposals); "related notes" (embeddings).
- **FR-NOTE-6** Full-text + semantic search (§16). Export any note as Markdown.
- **Edge cases:** paste 10MB image → client-side downscale to ≤2000px/85% JPEG, stored via upload service (`04_Architecture §Storage`), hard cap 10MB/file with error; conflicting edits from two tabs → last-save-wins + "newer version exists" banner (no CRDT in V1); todo-items inside notes are *not* tasks (deliberate — promotion via Extract tasks only).

## 12. Journal (JRNL)

Route `/journal` (timeline of entries) and `/journal/[date]` (one entry per calendar day).

- **FR-JRNL-1** Entry structure (all optional except mood encouraged): **Mood** (1–5 scale with emoji + optional feeling words); **Wins** (bulleted); **Lessons** (bulleted); **Gratitude** (bulleted, 3 slots); **Reflection** (free rich text, with rotating optional prompt e.g. "What drained you today?" — prompt bank of 30, editable in settings).
- **FR-JRNL-2** Streak counter (entry = any field filled). Reminder default 21:45 (configurable), skipped if entry exists.
- **FR-JRNL-3** History: calendar heatmap by mood color; mood-over-time line chart; "this day last month/year" resurfacing card.
- **FR-JRNL-4 [AI]**: weekly mood/theme digest (in weekly review); entries feed monthly review context. Journal text is **excluded** from AI context unless "allow journal in AI context" is on (default ON, one toggle, Settings → AI).
- **FR-JRNL-5** Entries are editable forever; edit history not kept (personal journal, not audit).
- **Edge cases:** backfilling old dates allowed; two quick-capture journal lines in one day append to the same entry's reflection; export includes journal as Markdown per entry.

## 13. Habits (HABIT)

Route `/habits`.

- **FR-HABIT-1** Habit fields: name, icon, color, area, type (`boolean` | `quantity` with unit+target, e.g. 8 glasses / 20 pages), schedule (daily / specific weekdays / n-times-per-week), preferred time-of-day (morning/afternoon/evening/anytime — informs planner & reminders), reminder toggle+time, start date, archived.
- **FR-HABIT-2** Logging: today row one-tap check or +quantity stepper; long-press → backfill previous days (up to 7). Water tracking is a built-in quantity habit wired to the water feature (§14.4) — one source of truth.
- **FR-HABIT-3** Streaks: current & best. `n-per-week` habits streak on weeks. **Skip** (with reason: sick/travel/rest) preserves streak; **miss** breaks it. Rollover job finalizes misses at day end.
- **FR-HABIT-4** Visuals: per-habit month heatmap, completion % (7/30/90d), all-habits week grid.
- **FR-HABIT-5** Habit ↔ goal link (habit consistency feeds goal progress §17).
- **FR-HABIT-6 [AI]** Missing-habit answers ("what habits am I missing?"), slippage detection ("Reading dropped to 40% these 2 weeks — reduce target?" as proposal).
- **Edge cases:** habit created mid-week with n-per-week → prorated first week; timezone change → day buckets keep original local_date; archiving keeps history and charts; quantity overshoot allowed (caps at 999).

## 14. Health Suite (HLTH)

Route `/health` with tabs: **Overview · Workouts · Nutrition · Sleep · Weight · Water**. Overview = today's snapshot + 7-day trend sparklines + quick-log buttons for everything.

### 14.1 Workouts
- **FR-HLTH-1** Exercise library: seeded ~60 common exercises (name, muscle group, type strength/cardio/mobility, unit scheme reps×weight | time | distance); user can add custom.
- **FR-HLTH-2** Workout templates: named list of exercises with default sets ("Push Day A"). Starting a workout from a template pre-fills last-used weights/reps.
- **FR-HLTH-3** Session logging: live mode (start → add sets: weight, reps, RPE optional; rest timer with notification; finish → duration auto) and quick retro mode (log after the fact). Notes per session.
- **FR-HLTH-4** History & progress: sessions list; per-exercise charts (est. 1RM = Epley, top set weight, volume); PR detection with celebration + life-timeline event; weekly volume by muscle group.
- **Edge cases:** abandoning a live session → auto-saved as draft, resumable same day, else auto-finished with logged sets only; unit preference kg/lb global with per-log conversion stored canonical kg.

### 14.2 Nutrition (deliberately lightweight)
- **FR-HLTH-5** Log meals: breakfast/lunch/dinner/snack; each meal = free-text name + kcal, protein g, carbs g, fat g (all optional except kcal or protein — at least one number).
- **FR-HLTH-6** Personal food library: any logged meal saved as reusable "food" with one-tap re-log ("usual breakfast"). Recent + favorites surfaced first. **No barcode scanner or food database in V1.**
- **FR-HLTH-7** Daily targets (kcal, protein) in settings; day rings; 7/30-day charts.
- **Edge cases:** partial macros fine; editing a library food doesn't rewrite past logs (logs snapshot values).

### 14.3 Sleep
- **FR-HLTH-8** Log: bedtime, wake time (crossing midnight handled), quality 1–5, optional note. One record per wake-date. Quick log from the Morning Briefing sleep row ("Slept 23:40–07:10?" prefilled from targets, adjust with sliders).
- **FR-HLTH-9** Charts: duration bars vs target band, quality line, bedtime consistency scatter. Sleep debt (7-day rolling vs target).
- **FR-HLTH-10** Sleep reminder: wind-down notification (default 30m before target bedtime), respects quiet hours exemption (it *is* the quiet-hours boundary).

### 14.4 Water
- **FR-HLTH-11** One-tap +glass (configurable ml, default 250) from the Today progress-strip ring, notification action button, or health tab; custom amount input; daily target (default 2500ml).
- **FR-HLTH-12** Smart reminders: only if behind pace (target × elapsed-day-fraction), max every 90m, within active hours, none in quiet hours, none within 90m of last log. Implemented as a built-in automation (§19), user-tunable.

### 14.5 Weight
- **FR-HLTH-13** Log weight (kg canonical, one decimal), date, optional note; multiple same-day logs keep last as canonical for charts.
- **FR-HLTH-14** Chart with 7-day moving average (headline number is the average, raw dots subdued — coaching copy explains why); goal line optional (links to a Goal §17); milestone crossings → life-timeline event.
- **Edge cases:** obviously wrong entry (>±20% of last) → confirm dialog; units display kg/lb.

---

## 15. Finance (FIN)

Route `/finance`. Tabs: **Overview · Transactions · Budgets · Subscriptions · Goals**. Manual tracking; **no bank sync in V1**. Single currency (default INR ₹, configurable, no multi-currency math).

- **FR-FIN-1 Accounts**: simple named containers (Cash, HDFC, Credit card) with type and manual starting balance; balances derived = start + Σ transactions. Transfers between accounts supported (paired transactions, excluded from spend analytics).
- **FR-FIN-2 Transactions**: amount, type (expense/income/transfer), account, category, date, merchant/note, tags, recurring flag. Entry ≤ 3 interactions via quick capture (`"250 lunch"` → amount + category guess from keyword map, **[AI]** fallback categorization proposal).
- **FR-FIN-3 Categories**: seeded two-level set (Food → eating out/groceries; Transport; Bills; Entertainment; Education; Health; Shopping; Misc; plus Income set). Editable, colored, icon.
- **FR-FIN-4 Budgets**: monthly amount per category (and one overall cap). Progress bars; pace line ("day 20: 85% used"); threshold notifications at 80% and 100% (built-in automation).
- **FR-FIN-5 Subscriptions**: name, amount, cycle (monthly/yearly/custom days), next renewal date, account/category, active flag. Auto-creates the expense transaction on renewal date (marked origin=`automation`, notification with "didn't happen" undo). Renewal reminders default 3d before. Overview card: monthly-equivalent total.
- **FR-FIN-6 Savings goals**: name, target amount, target date optional, manual contributions (transactions of type transfer to a virtual "savings" bucket or plain progress entries — V1 uses plain contribution records). Progress bar + projected completion at current pace.
- **FR-FIN-7 Overview**: this-month spend vs budget donut by category, income vs expense bar, biggest categories, recent transactions, subscription total, savings snapshot. Month switcher for history.
- **FR-FIN-8 Reports**: monthly summary auto-compiled into Monthly Review (§18); CSV export any range.
- **Edge cases:** deleting a category with transactions → reassign flow (pick target category); backdated transactions recompute that month's stats; renewal on Feb 30 → last day of month; refund = negative expense (kept in same category).

---

## 16. Command Center (SRCH)

The Raycast-grade front door: **everything searchable, every action runnable, from one input.**

- **FR-SRCH-1** `⌘K` opens the Command Center from anywhere: top section **commands** (navigation "Go to Habits", actions "New task", "Enter Focus Mode", "Switch season → Exam week", "Log water", "Toggle theme" — fuzzy matched), bottom section **results** as you type (≥2 chars).
- **FR-SRCH-2** Search corpus — every entity type: tasks, projects, notes, journal entries, events, habits, transactions (merchant/note), workouts, goals, reminders/notifications history, automations, inbox items, seasons, settings pages. Grouped results with type icons, best 3 per group, "see all" per group → full results page `/search?q=`.
- **FR-SRCH-3** Ranking: exact/prefix title match > full-text relevance (Postgres FTS) > semantic similarity (pgvector) **[AI-lite: embeddings only]**. Recency boost. p95 < 150ms for lexical; semantic merged in as it arrives (progressive).
- **FR-SRCH-4** Filters in query: `type:note`, `area:college`, `before:2026-05-01`.
- **FR-SRCH-5** Natural-language questions (detected by pattern: starts with wh-word/ends with "?") route to **Ask AI** row → assistant with query prefilled **[AI]**.
- **Edge cases:** embeddings backlog (new import) → lexical-only with subtle "indexing…" note; deleted/archived content excluded unless `include:archived`.

## 17. Long-term Goals (GOAL)

Route `/goals`. Yearly/quarterly personal goals ("Reach 75kg", "Ship side project", "CGPA ≥ 8.5").

- **FR-GOAL-1** Fields: title, why (motivation text), area, target date, metric type (`checklist` of milestones | `number` current→target with unit | `habit-linked` consistency % | `manual` slider), linked projects/habits, status (`active·achieved·missed·dropped`).
- **FR-GOAL-2** Progress auto-derives where linked (weight goal reads weight logs; habit goal reads completion %; project goal reads project progress). Manual check-ins (note + progress) form a per-goal journal.
- **FR-GOAL-3** Review cadence: goals appear in weekly planning ("nudge: no progress on Ship side project in 3 weeks") and monthly review with per-goal prompts.
- **FR-GOAL-4** Achieved → celebration moment + life-timeline milestone.
- **Edge cases:** target date passes unachieved → status prompt (extend/missed/drop), never silent; max ~12 active goals encouraged via gentle warning (not enforced).

## 17A. Seasons of Life (SEASON)

A declared mode that tells the whole system what life looks like right now — because exam week and vacation should never be planned, prioritized, or nudged the same way.

- **FR-SEASON-1** A season = name, kind (preset), start date, optional end date, config. Shipped presets: **Exam week · Internship crunch · Hackathon · Placement prep · Gym cut · Gym bulk · Travel/Vacation · Recovery (sick) · Normal** (default). One active at a time, always user-declared — via Command Center ("Switch season…"), Settings → Seasons, or a Tomorrow Studio prompt when a preset trigger nears (exam in ≤7 days → DecisionCard "Enter exam week?").
- **FR-SEASON-2 Deterministic effects** from `seasons.config`: prioritizer **area weights** (exam week: College ×2, Projects ×0.5); planner overrides (deep-work cap, wake bounds, protected block types — gym-cut protects workout blocks, travel makes them optional); **notification profile** (vacation: critical + journal nudge only); habit expectations (habits marked *pausable* auto-`skip` without breaking streaks during travel/recovery); Morning Briefing row order (exam week lifts Deadlines to position 2).
- **FR-SEASON-3 Visibility**: top-bar chip everywhere ("🎯 Exam week · 4d left"); ending a season prompts a 3-line retro ("keep any of these settings?").
- **FR-SEASON-4 [AI]** The active season + config summary is always in AI context (06 §4); planner, assistant, and recommendations must reference it when it changes their output ("It's exam week — deferring the side project").
- **FR-SEASON-5 History**: past seasons keep their date spans; the Life Timeline renders them as labeled background bands (§22).
- **Edge cases:** declaring a new season ends the current one (same-day switch allowed); end date passes → auto-revert to Normal + notification; custom season = nearest preset cloned then edited; deleting a season keeps its historical span unless explicitly purged.

## 18. Weekly Planning & Monthly Review (REVIEW)

### 18.1 Weekly planning — `/plan/week`
Guided flow, prompted Sunday 18:00 (configurable) + a Today card all Sunday/Monday until done:
1. **Last week** — auto stats (tasks, habits %, focus hours, workouts, spend vs budget) + **[AI]** 3-sentence narrative; user adds "biggest win / biggest drag".
2. **Calendar scan** — next week's events/deadlines/exams listed; add missing ones inline.
3. **Weekly priorities** — pick 3–5 outcomes for the week (free text or linked to tasks/projects/goals). Stored, shown atop planner all week with per-priority done toggles.
4. **Commitments** — target focus hours, workouts, any habit adjustments → sliders.
Output row in `weekly_plans`; completion streak tracked.

### 18.2 Monthly review — `/review/month`
Prompted 1st of month. Auto-compiled report: tasks/projects shipped, habit table, health trends (weight, sleep, workouts), finance summary (spend by category vs budget, savings delta), journal mood curve, goals progress; **[AI]** reflective narrative + 3 suggested adjustments (proposals: e.g., "reduce reading target", "budget +10% food"). User reflection fields: proud of / struggled with / change next month. Saved immutable snapshot (data denormalized into the review row so later edits don't rewrite history).

## 18A. Focus & Productivity Analytics (ANLYT)

Route `/analytics`. Answers "is the system actually working?" with numbers the rest of the app already generates. **All math is deterministic** (computed from `focus_sessions`, `time_blocks`, `day_plans`, `ai_actions`, `energy_logs`, notifications) — no LLM arithmetic.

- **FR-ANLYT-1 Headline cards** (Week / 30d / All-time tabs, each with delta vs. previous period):
  - **Deep work** — total & average per day ("This week: 14h · avg 2h/day, ▲1.5h");
  - **Interruptions** — count + per focus-hour rate ("12 · 0.9/h");
  - **Most productive window** — completion-weighted hour-of-day heat ("9–11 AM");
  - **Planner accuracy** — % of planned blocks completed as planned, with slipped/skipped breakdown ("92%");
  - **AI recommendation acceptance** — % of proposals accepted / edited / rejected, by kind ("84%");
  - **Estimate accuracy** — actual÷estimated minutes distribution;
  - **Energy** — Low/Med/High distribution + energy-vs-deep-work overlay.
- **FR-ANLYT-2 Visuals**: hour-of-day × weekday productivity heatmap; deep-work trend line vs target band; interruption-reasons bar; planner-accuracy trend.
- **FR-ANLYT-3** The same cards embed in Weekly Planning step 1 and the Monthly Review (one component, three surfaces).
- **FR-ANLYT-4** Every metric shows its formula in a ⓘ tooltip (defined in `packages/core/insights`) — no mystery numbers. Minimum-data states: "Log 5 focus sessions to unlock."
- **Edge cases:** retro-logged blocks excluded from interruption stats; timezone changes bucket by `local_date`; deleted tasks keep their historical session minutes.

## 19. Automation Engine (AUTO)

Route `/automations`. Trigger–condition–action rules, user-built from vetted primitives (no arbitrary code).

- **FR-AUTO-1 Triggers**: time schedule (RRULE, e.g. daily 21:45); entity events (task became overdue, task completed, event starts in X min, habit missed at day end, weight logged, budget threshold crossed, subscription renews in X days, plan not created by X time, no water logged for X h, journal missing at X time); manual ("run now" for testing).
- **FR-AUTO-2 Conditions** (all optional, AND-ed): area/tag/priority filters, day-of-week, time window, metric comparisons (water < 50% target, sleep < 6h, spend(category, month) > X), habit streak comparisons.
- **FR-AUTO-3 Actions**: send notification (title/body templates with variables like `{{task.title}}`, channel, silent flag); create task (template incl. relative due); create/log habit skip; move task to date; create time-block proposal; add journal prompt; run AI briefing **[AI]** (e.g., "summarize my day at 22:00").
- **FR-AUTO-4** Built-in automations shipped enabled (all are ordinary editable rules): meeting reminder (event −10m), workout reminder, deadline warnings (assignment −48h/−24h), water pacing (§14.4), sleep wind-down, journal nudge, weekly-planning prompt, budget 80/100%, subscription renewal, morning digest (07:00, notification summarizing the day), overdue digest (daily 09:30 if overdue > 0).
- **FR-AUTO-5** Rule management: enable/disable, run history (last 20 runs with outcome), test-run with dry output preview, duplicate, delete.
- **FR-AUTO-6** Safety rails: max 60 automation notifications/day globally (then digest-batched), per-rule cooldown (min 15m), infinite-loop guard (automation-created entities do not fire entity triggers, i.e. `origin='automation'` events are non-triggering).
- **Edge cases:** rule references deleted entity → auto-disabled with badge and notification; overlapping duplicate notifications within 5 min are deduped by (type, entity) key.

## 20. Notifications (NOTIF)

A core system. Full engine design in `04_System_Architecture §7`.

- **FR-NOTIF-1 Channels**: in-app (bell + toast, always on), desktop web-push, mobile PWA web-push. Per-device subscription management (name, last seen, revoke) in Settings.
- **FR-NOTIF-2 Types** (each with per-type channel + sound defaults, user-editable matrix): `task_reminder, event_reminder, deadline_warning, habit_reminder, water_reminder, sleep_reminder, workout_reminder, journal_nudge, planning_prompt, weekly_planning, budget_alert, subscription_renewal, morning_digest, evening_digest, ai_proposal, automation_custom, system`.
- **FR-NOTIF-3 Scheduling**: exact-time delivery within ±30s (1-minute scan cadence + due-time queue, see architecture). Recurring reminders derive from their owning entity (event reminders, habit times) — no duplicated schedule state.
- **FR-NOTIF-4 Actions on the notification** (web-push action buttons + in-app): Complete / Snooze (10m·1h·tonight·tomorrow) / Open. Water reminder: "+250ml" logs directly. Snoozing reschedules the same notification, marked `snoozed`.
- **FR-NOTIF-5 Quiet hours**: default 23:00–07:30. During quiet hours everything is **held** (delivered as morning digest) except: sleep reminders and alarms explicitly marked `critical` (event reminders can be marked critical per event).
- **FR-NOTIF-6 Silent reminders**: delivered to in-app history + badge only, no push/sound. Any type can be set silent globally or per-rule.
- **FR-NOTIF-7 History**: `/notifications` — reverse-chron feed, filter by type, read/unread, per-item "why did I get this?" (source rule/entity), clear-all. Retained 90 days.
- **FR-NOTIF-8** Dedup & sanity: identical (type, entity, scheduled minute) collapse to one; if >5 fire in one minute they collapse into a single digest push.
- **FR-NOTIF-9 Focus hold**: while a focus session is active (§6A), all non-`critical` notifications are held and delivered as a mini digest when the session ends. Season notification profiles (§17A FR-SEASON-2) apply the same hold semantics to their muted types.
- **Edge cases:** push permission denied → per-device banner with re-enable instructions, in-app still works; subscription expired (410) → auto-pruned + Settings badge; device offline at fire time → push service retries per Web Push TTL (1h for reminders, 24h for digests), in-app copy always present; user in different TZ while traveling → toggle "use device timezone" (default: home TZ).

## 21. AI Assistant (AI)

Full design in `06_AI_Architecture`. Product surface:

- **FR-AI-1** Access: `⌘J` right-side drawer over any page (400px), or full page `/assistant`. Conversations persist; sidebar lists past conversations; new chat starts fresh but memory persists (see 06).
- **FR-AI-2** Grounded Q&A over my data via tools: "What should I do today?", "What is overdue?", "What should I prioritize?", "When did I last work on Project X?", "What meetings do I have tomorrow?", "What habits am I missing?", "How did I sleep this week?", "How much did I spend on food?" — answers cite entities as tappable chips.
- **FR-AI-3** Action proposals in-chat: "add a task to renew my domain Friday" → proposal card (Accept/Edit/Reject) inline (§2.2). Batch proposals grouped.
- **FR-AI-4** Context chips: the assistant shows which data it consulted ("read: today's plan, 12 tasks, calendar"). Transparency, not configurability.
- **FR-AI-5** Streaming responses; stop button; retry; copy. p50 first token < 2s.
- **FR-AI-6** Failure handling: API error → readable message + retry; content refusal (`stop_reason: refusal`) → automatic fallback model retry (see 06), else friendly "can't help with that".
- **FR-AI-7** Budget guard: token spend tracked per day (`ai_usage_log`); soft cap (default $2/day) → assistant warns and requires per-message confirm; hard cap (default $5/day) → assistant paused until midnight, everything else in the app keeps working. Caps configurable.
- **FR-AI-8** Settings → AI: model tier (Best = default / Economy), local-only mode (disables all external calls), journal-in-context toggle, memory viewer (list of remembered facts, delete any), spend dashboard.
- **FR-AI-9** Decision framing: assistant answers about state end with a proposed decision per §2.7 — "What's overdue?" → the list, then "Finish 3 · Ignore 5 — want me to reschedule the rest?".

## 22. Life Timeline (LIFE)

Route `/timeline`. A vertical, zoomable chronicle of my life inside the system.

- **FR-LIFE-1** Event sources: **auto** (project completed, milestone hit, goal achieved, exam taken, PRs, weight milestones, streak records ≥ 30d, semester start/end, internship start/end, first-use anniversary) and **manual** ("Moved to hostel", with date, title, description, icon, photo optional).
- **FR-LIFE-2** Views: month clusters → year overview (zoom out shows counts + highlights per month); filter by area/kind.
- **FR-LIFE-3** Auto-events are generated by the worker on the triggering action, deduped, deletable (deleting hides, doesn't delete the source).
- **FR-LIFE-4 [AI]** Year wrap: "2026 in review" narrative generated on demand from timeline + reviews.
- **FR-LIFE-5 Activity fabric**: a GitHub-style contribution heatmap (per-day intensity from `activity_log`) heads the selected year; season spans (§17A) render as labeled background bands along the spine — the timeline should read like *"Started internship → Reached 82kg → Finished Stage 7 → Went to Goa → Completed semester → Gym streak 100"* at a glance.
- **FR-LIFE-6 Memories resurfacing**: an "On this day" card (1 month / 1 year / n years ago) built from timeline events, journal highlights, and photos — shown on the Timeline page and, when a good memory exists, as the Morning Briefing closer (§4.2 row 13). Apple-Photos-memories feel: photo-forward when a photo exists.
- **Edge cases:** retroactive manual events (any past date) fine; bulk noise (e.g., 10 PRs one week) → same-kind events within 7 days cluster into one card; "on this day" with nothing to show renders nothing (never a filler card).

## 23. Settings (SET)

`/settings/*` — sections: **Profile** (name, email, avatar, timezone, day boundaries, week start, units kg/lb·ml·currency), **Appearance** (theme dark/light/system — dark default; accent color from 6 presets; density comfortable/compact; reduce motion), **Planning** (all §6.3 defaults, Focus Mode music URL, energy check-in prompts), **Seasons** (§17A presets, custom configs, history), **Notifications** (type×channel matrix, quiet hours, per-device list), **AI** (§21 FR-AI-8), **Automations** (link to /automations), **Health targets** (water, sleep window, kcal/protein, weight goal ref), **Finance** (currency, month start day, categories editor), **Data** (export, import, backup status & history, trash), **Security** (password, sessions, auto-lock, recovery key regen), **About** (version, changelog, licenses).

Every setting change applies instantly (optimistic) and is stored in `user_settings` JSONB with schema validation; unknown keys rejected.

## 24. Data Import, Export, Backup & Restore (DATA)

- **FR-DATA-1 Full export**: one click → background job → ZIP containing: `data.json` (complete, versioned schema), per-module CSVs (tasks, transactions, logs…), Markdown folder (notes, journal), `manifest.json` (schema_version, exported_at, counts). Download link + notification when ready; files auto-delete after 7 days.
- **FR-DATA-2 Import**: JSON (own format — full restore-merge with dry-run diff preview: creates/updates/skips counts before commit) and CSV per module with column-mapping UI (headers auto-matched, saved mappings). Duplicate strategy: skip / create-new. Every import runs in a transaction; failure = zero partial writes; import report kept.
- **FR-DATA-3 Backups**: nightly 02:30 `pg_dump` (custom format) + uploads directory tarball → encrypted (age) → uploaded to S3-compatible bucket (+ kept locally, 7 daily / 4 weekly / 6 monthly rotation). Status (last success, size, next run) visible in Settings → Data; failure raises a `system` notification and a red settings badge.
- **FR-DATA-4 Restore**: documented CLI runbook (server-side) + in-app "restore from backup" listing available snapshots (executes maintenance-mode restore; app shows lock screen during).
- **FR-DATA-5 Verify**: weekly job restores latest backup into a scratch schema and sanity-counts rows; result surfaced in Settings.

## 25. Cross-cutting Non-functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | p75 interaction latency < 100ms (optimistic UI); server p95 API < 300ms for queries, < 800ms writes |
| NFR-2 | Initial load: FCP < 1s desktop / < 2.5s mobile (mid-range) on repeat visit (PWA cache) |
| NFR-3 | Works offline read-only (last cached data) with clear offline banner |
| NFR-4 | Accessibility: full keyboard operability, visible focus, WCAG AA contrast (verified against dark tokens), `prefers-reduced-motion` honored, semantic landmarks, screen-reader labels on all controls |
| NFR-5 | All list views virtualize beyond 100 rows; no view degrades below 60fps scroll on target hardware |
| NFR-6 | Data integrity: every multi-entity mutation transactional; soft deletes; FK constraints on |
| NFR-7 | Observability: structured logs, error tracking (self-hosted Sentry-compatible), job dashboard (see 04) |
| NFR-8 | Security: TLS only, secure/httpOnly/SameSite=Lax cookies, CSRF-safe mutations, CSP, rate limits, dependency audit in CI |
| NFR-9 | AI unavailability degrades every [AI] feature to its documented deterministic fallback or hides the affordance — never a broken screen |
| NFR-10 | The whole system (app+worker+db) runs in < 2GB RAM on a small VPS |
