# 06 — AI Architecture

**Project:** My OS
**Scope:** every AI-powered capability: daily planner, context engine, task prioritizer, reminder intelligence, recommendations, life-timeline narratives, assistant, memory, search embeddings — plus prompt strategy, cost control, and failure handling. Product-level requirements are in `02_PRD` (§2.2 proposals, §21 assistant); this document defines how.

---

## 1. Principles

1. **Propose, never impose.** All AI writes to user data flow through `ai_actions` proposals (PRD §2.2). Direct writes limited to: summaries, embeddings, scores, timeline auto-events.
2. **Deterministic skeleton, LLM judgment.** Wherever a correct-by-construction core exists (scheduling constraints, streak math, budget math), the LLM shapes and explains on top of it — it never re-derives arithmetic or constraint satisfaction.
3. **Grounded or silent.** Assistant answers must come from tool results over real data, with entity citations. No tool data → say so.
4. **Degrade gracefully.** Every feature has a documented no-AI fallback (NFR-9). AI layer is behind a single `AiService` interface in `packages/ai`; `local_only` mode stubs it.
5. **Server-side only.** Browser never talks to AI providers. Keys live in server/worker env.

## 2. Providers & Models

| Role | Model | Used for |
|---|---|---|
| **Primary** | `claude-opus-4-8` (Anthropic) | Assistant conversations, day-plan generation, weekly/monthly narratives, replanning |
| **Lightweight** | `claude-haiku-4-5` | Classification (expense category, capture parsing fallback), title generation, one-line summaries, memory extraction candidates |
| **Batch** | same models via **Message Batches API** (50% cost) | Nightly plan pre-generation, weekly digests, memory consolidation, backfill summarization |
| **Embeddings** | Voyage AI `voyage-3.5-lite`, 1024 dims, cosine | Semantic search, related-notes, memory retrieval |

Settings → AI exposes tier choice: **Best** (Opus 4.8 primary, default) / **Economy** (`claude-sonnet-5` primary). Model IDs are config, not code constants (`packages/ai/config.ts`), so upgrades are one-line.

**API usage conventions (Anthropic, current surface):**
- Thinking: `thinking: {type: "adaptive"}` on primary-model calls; `output_config.effort` per feature: assistant `high`, planner `high`, narratives `medium`, Haiku tasks omit.
- No `temperature/top_p/top_k` (removed on Opus 4.8); no assistant prefills (use structured outputs instead).
- **Structured outputs** via `output_config: {format: {type:"json_schema", schema}}` for every machine-consumed response (plans, proposals, classifications); tool definitions use `strict: true` with `additionalProperties:false`.
- Streaming for all interactive calls (`messages.stream`, `finalMessage()`); non-streaming only for Haiku micro-calls and batches.
- Handle `stop_reason` exhaustively: `refusal` → retry once on fallback model (`claude-sonnet-5`), else user-friendly notice; `max_tokens` → retry with larger budget once; `pause_turn` → continue loop.
- Token accounting from `usage` on every response → `ai_usage_log`.

## 3. Component Map

```
                          ┌────────────── packages/ai ──────────────┐
 tRPC ai.* / worker jobs →│ AiService                                │
                          │  ├─ ContextEngine (snapshot builders)    │→ Anthropic API
                          │  ├─ Assistant (agent loop + tools)       │→ Voyage API
                          │  ├─ PlannerAI (wraps core scheduler)     │
                          │  ├─ Prioritizer (score + LLM tie-break)  │←→ Postgres (read tools,
                          │  ├─ ReminderIntelligence                 │    proposals, memories,
                          │  ├─ Recommender (weekly/monthly)         │    embeddings, usage log)
                          │  ├─ NarrativeEngine (reviews, year wrap) │
                          │  ├─ MemoryManager                        │
                          │  └─ EmbeddingIndexer                     │
                          └──────────────────────────────────────────┘
```

## 4. Context Engine

Builds bounded, structured snapshots of user data for prompts. Never dumps tables.

**Snapshot builders** (each returns typed JSON + token estimate, serialized deterministically — sorted keys — for cache friendliness):

| Builder | Contents | Budget (tok) |
|---|---|---|
| `profile` | name, TZ, day bounds, planning settings, health targets, active areas | 300 |
| `season` | active season: kind, days remaining, config summary (area weights, planner overrides, notification profile) | 150 |
| `today` | date/time, **today's energy check-in**, day plan + block statuses, today's events, habits state, water/sleep, active block/focus session | 900 |
| `tasks_relevant` | overdue, due ≤7d, top-scored 20 (from Prioritizer), blocked list | 1,200 |
| `calendar_window` | events/classes ±7d | 600 |
| `projects_active` | name, deadline, health, blocker, progress, last activity | 500 |
| `college` | due assignments, upcoming exams w/ syllabus completion | 500 |
| `health_week` | 7d: sleep, workouts, water, weight trend | 400 |
| `finance_month` | budget states, notable spend, renewals | 400 |
| `journal_recent` | last 7 moods + 3 latest entry summaries (only if journal-in-context ON) | 400 |
| `goals` | active goals + progress + staleness | 300 |
| `weekly_priorities` | current week's priorities + status | 200 |
| `memories` | top-k retrieved memories (§11) | 400 |
| `retrieved` | semantic search results for the current query | 800 |

Feature profiles pick builders: **assistant** = dynamic (see §5: seed = profile+season+today+memories, tools fetch the rest); **planner** = profile+season+today+tasks_relevant+calendar_window+weekly_priorities+memories+health_week; **weekly review** = stats builders + journal_recent; etc. `season` is included in **every** profile (PRD FR-SEASON-4). Hard cap 8k input tokens per request (excluding cached system prompt); builders truncate lowest-priority sections first and note truncation in the payload.

## 5. AI Assistant (agent loop)

Custom tool-use loop (manual loop, not SDK runner — we need per-tool auth, logging, and proposal interception), max 8 iterations, wall-clock cap 60s.

**Read tools** (all `strict:true`, execute as parameterized queries via `packages/db`; results compact JSON, ≤2k tokens each, truncation flagged):
`query_tasks(filter: status?, area?, project?, due_before?, overdue?, text?, limit)` · `query_calendar(from, to)` · `get_day_plan(date)` · `query_habits(range)` · `query_health(metric: sleep|water|weight|workouts|nutrition, range)` · `query_finance(kind: summary|transactions|budgets|subscriptions, month?, category?)` · `query_projects(status?)` · `query_goals()` · `query_journal(range)` (respects privacy toggle) · `search_semantic(query, types?, limit)` · `get_activity(entity_type, entity_id | text)` (powers "when did I last…") · `get_reviews(kind, period)` · `query_focus_stats(range)` (deep work, interruptions, planner accuracy — for analytics questions) · `query_inbox(status?)`.

**Propose tools** (create `ai_actions` rows; never mutate directly):
`propose_tasks(tasks[])` · `propose_events(events[])` · `propose_day_plan(date, blocks[])` · `propose_reschedule(changes[])` · `propose_habit_change(habit_id, change)` · `propose_reminder(notification spec)` · `propose_inbox_organization(items[])` (FR-INBOX-5 batch sort) · `propose_season(kind, config?)` (season switches are proposals too).

**Meta tools:** `remember(content, kind)` (writes `ai_memories`, source `user_told` — the one direct write, since the user explicitly asked) · `ask_clarification(question)` (ends turn with a question).

**Flow:** user msg → seed context (`profile`+`today`+`memories`+page context) → loop (parallel tool calls supported; all `tool_result`s returned in one user message) → final text streamed with citations (every factual claim carries `[entity_ref]` markers the UI renders as chips) → proposals rendered as cards. Conversation persisted (`ai_messages`); history window = last 30 messages, older turns summarized into a rolling conversation summary (stored on conversation row) to keep context small.

## 6. PlannerAI (day plan generation & rescue)

**Hybrid pipeline:**
1. `packages/core/scheduling` computes free intervals + scored candidates + constraint set (deterministic, §04.6).
2. LLM receives: constraint report (including today's energy modifiers and active-season overrides, already applied to free intervals and caps), candidate list (scores already season-weighted, with estimates/energy/deadlines/rationale inputs), planner snapshot, user steering text (if any), memories (e.g., "hates early deep work"). Task: *select and arrange* candidates into the free intervals, choose block titles, decide focus groupings, breaks and buffers within the given rules — **it may not invent time outside free intervals or drop constraints**.
3. Response = structured output against `DayPlanDraft` JSON schema: `{blocks:[{type,title,start,end,taskIds?,routineId?,rationale}], unplaced:[{taskId,reason}], summary}`.
4. **Validator** (deterministic) re-checks every constraint (bounds, overlaps with fixed items, break rules, caps). Violations → one repair round-trip with violation list; still invalid → fall back to pure deterministic plan, flag `generation_meta.fallback=true`.
5. Draft stored as `day_plans(status='draft')` + draft blocks; user accept per PRD §6.4.

**Rescue my day** = same pipeline scoped to `now→sleep`, fixed items include completed/active blocks.
**Nightly pre-generation** (03:30 worker job) runs via **Batch API** when next-day has ≥1 task/event; the Morning Briefing's AI-recommendation row (PRD §4.2 row 12) shows the ready draft instantly.

## 7. Task Prioritizer

Two layers:
- **Score layer (deterministic, always on, no LLM):** `packages/core/priority.ts` — `score = 4·urgency + 3·priority + 2·alignment + 1·age + 0.5·momentum − blockedPenalty`, where urgency is a due-proximity curve (overdue asymptote), alignment = linked to weekly priority/goal **× active-season area weight** (PRD §17A), momentum = touched in last 48h. Recomputed on read (cheap); powers Today ordering, Now card fallback, planner candidates.
- **Judgment layer [AI]:** for the Now card and "what should I prioritize?" answers, the top ~10 scored tasks + today snapshot go to the primary model, which picks and *explains* ("Physics due tomorrow and you're free until 16:00"). Structured output `{taskId, reason, alternates:[taskId]}`. Cached 15 min or until data changes (domain-event keyed). LLM disagreement with score order is allowed (that's its value) but it can only choose among provided candidates.

## 8. Reminder Intelligence

Base reminders are rule-driven (automations, §04.7-8). The AI layer adds:
- **Digest composer:** morning/evening digests and quiet-hours held-batch are compiled by Haiku into one tight notification body ("3 tasks, Physics lab 14:00, water 40% yesterday") — template fallback if AI off.
- **Pacing suggestions (proposals):** weekly job reviews notification interactions (`acted` vs ignored rates per type from `notifications`) and proposes tuning ("You ignore 90% of water reminders at 09:00 — shift start to 10:30?") as `ai_actions`.
- **Deadline risk warnings:** daily job — for assignments/exams/tasks with estimates, compares remaining effort vs. free capacity (deterministic calc); LLM writes the warning copy; fires `deadline_warning` notification when risk ≥ threshold.
All nudge copy follows the decision grammar (PRD §2.7): situation → recommendation → ≤2 alternates → cost of ignoring. It never creates new notification categories on its own; everything maps to existing types with user-controllable settings, filtered through the active season's notification profile.

## 9. Recommendation Engine & Page Insights

Feeds Weekly Planning step 1/4 and Monthly Review suggestions (PRD §18): input = stats snapshots + goal staleness + habit completion deltas + budget variance + season context; output = ≤3 structured suggestions `{kind: habit_target|budget|planning|goal_nudge, change, rationale}` rendered as ProposalCards. Runs on Batch API Sunday/1st. Deterministic fallback: rule-based nudges (goal untouched 21d, habit <50% for 2 weeks, category >100% twice).

**Page-question insights (PRD §2.7):** every major page's pinned question is answered by a two-layer slot:
1. **Deterministic fill** — computed in `packages/core/insights`, one function per page: Today → prioritizer #1; Planner → remaining free minutes + top candidate; Projects → blocked/stalled list; Health → lowest-7-day-completion habit; Finance → most over-pace category; Journal → mood trend; Timeline → last-30-days highlights. Always available, AI-off shows this verbatim.
2. **[AI] copy pass** — Haiku rewrites the fill into one natural sentence *with the decision attached* per the decision grammar (situation → recommendation → alternates → cost). Cached until the underlying data changes (domain-event keyed), so at most a handful of Haiku calls per day.
DecisionCard copy everywhere (triage, workout nudge, parking-lot revival) uses the same two-layer pattern: deterministic facts and numbers, optional AI phrasing — the LLM never computes the numbers.

## 10. Life Timeline & Narrative Engine

- Auto-event **detection is deterministic** (worker outbox rules, §05.11). AI adds: milestone card blurbs (one Haiku sentence, stored on the event), and on-demand narratives: **weekly digest** paragraph, **monthly review** narrative + suggestions, **year wrap** (timeline + reviews + stats → structured story with sections; rendered as a special page). All narrative jobs run on Batch API.

## 11. Memory

Table `ai_memories` (§05.13). Kinds: `fact` ("gym is 20 min away"), `preference` ("no deep work after 21:00"), `pattern` ("energy dips post-lunch").
- **Write paths:** (a) user tells assistant → `remember` tool (immediate, `user_told`); (b) **weekly consolidation job** (batch): reviews the week's conversations, corrections, and rejected/edited proposals → candidate memories → stored as *proposals* (`ai_actions kind='memory'`), becoming memories only on acceptance (`inferred_confirmed`).
- **Retrieval:** embed each memory; per-request top-k (k=6) by cosine against the query/feature intent + recency/use-count boost; retrieved ids get `last_used_at`/`use_count` bumped. Planner always retrieves against "planning preferences".
- **Hygiene:** memory viewer in Settings → AI (list, edit, delete); contradiction handling in consolidation (new memory supersedes → old one soft-deleted with pointer); cap 200 active memories (consolidation merges).

## 12. Embeddings & Semantic Search

- Indexer job consumes `domain_events` for content changes → chunk (notes/journal by ~800-token blocks; tasks/projects/events/goals as single docs) → skip if `content_hash` unchanged → Voyage embed (batch up to 128 inputs/call) → upsert `embeddings`.
- Query path (`search.semantic`, assistant `search_semantic`): embed query (`input_type:'query'`) → HNSW cosine top-20 → merge with FTS results (Reciprocal Rank Fusion) → return typed refs.
- Backfill command for imports; "indexing…" state per PRD FR-SRCH edge case. Voyage outage → lexical-only (flag in response).

## 13. Prompt Engineering Strategy

- **Layout for cache efficiency (prefix-stable):** `[system: persona + app concepts + tool-use rules + output rules]` → `[tools]` → **cache breakpoint** (`cache_control: ephemeral`) → `[dynamic: snapshots, memories, conversation]`. System prompt + tools are frozen strings (versioned in `packages/ai/prompts/`, no timestamps/interpolation); current date/time passed in the dynamic section. Target: >80% cache-read on assistant turns within a session.
- **Persona (excerpt of intent):** *calm chief of staff; concise; concrete numbers and times; never cheerleading; answer first, then detail; always cite entity refs for factual claims; when data is missing say so; propose instead of instructing the user to do data entry; frame state-answers as decisions — recommendation, at most two alternatives, cost of ignoring (PRD §2.7); respect today's energy and the active season, and say so when they change the advice.* Full canonical text lives in `prompts/system.assistant.md` (single source, reviewed like code).
- **Per-feature prompts** are small task headers appended in the dynamic zone, not separate system prompts (cache preservation). Each documents: goal, inputs, output schema ref, refusal-to-hallucinate rule, examples (1 good/1 bad).
- **Steering inputs** (user free text like "more breaks") are wrapped in delimiter blocks and treated as preferences, never as instructions that override safety/constraint rules.
- **Testing:** golden prompt-fixture tests (snapshot inputs → schema-valid outputs asserted structurally, not string-exact); eval checklist per prompt change (see 08 §Testing).

## 14. Cost Model & Budget Guard

Estimated steady-state (Opus 4.8 primary, caching on): assistant ~15 turns/day ≈ 60k in (mostly cached) + 8k out; planner 1–2 gens; nightly batch jobs. Rough ceiling **$0.9–1.8/day ≈ $27–55/mo**; Economy tier ≈ ⅓ of that. Controls:
- All calls log to `ai_usage_log` (tokens + computed cost). Settings dashboard: today/month spend, per-feature split.
- Soft cap ($2/day default): interactive AI asks confirmation per message; background jobs switch to Haiku or skip non-essential (narratives) first.
- Hard cap ($5/day): AI paused → `AI_BUDGET_EXCEEDED` errors → UI states per PRD FR-AI-7. Caps configurable; batch jobs always use Batch API pricing.

## 15. Failure, Safety, Privacy

- **Timeouts:** interactive 60s (stream started ⇒ let finish), background 5 min; pg-boss retries background ×3.
- **Refusals** (`stop_reason:'refusal'`): retry once on `claude-sonnet-5` fallback; still refused → friendly message; never retry-loop.
- **Schema-invalid output:** one repair attempt with validator errors; then deterministic fallback path of that feature.
- **Hallucination guards:** IDs in proposals validated against DB before rendering (unknown id ⇒ proposal rejected server-side); citations resolved or stripped.
- **Privacy:** context minimization per §4; journal toggle; `local_only` global switch; no training-data sharing (API defaults); AI provider sees data transiently under Anthropic API data policy — documented for the owner in Settings → AI.
- **Prompt injection:** external text never enters prompts in V1 (no web/email ingestion); imported notes are data-in-snapshots only, and system prompt instructs to treat snapshot content as data, not instructions.
