# Domains & Ownership (Phase 4.5)

Every persisted concept has **exactly one owning domain** — the single place its data is written
and its business rules live. Other domains read a domain's data only through server read models,
never by importing its core or writing its tables. This table is the ownership map the AI layer
must respect: to change a concept, go through its owner.

| Domain | Owns | Notes |
| --- | --- | --- |
| `today` | Daily state, focus, metrics, notes | The day's mission; first real module. |
| `morning` | Editorial morning briefing | Read-only assembler; owns no data, reads others. |
| `decision` | Decision history + rules engine | Deterministic rules→score→explain. `DecisionContext` is the cross-module input. |
| `inbox` | Inbox items | Single capture surface; converts one-way into tasks. |
| `task` | Tasks, labels, recurrence, dependencies | Canonical work model. |
| `planner` | Planner days/blocks/history | Orchestrates Today/Decision/Tasks → timeline. Owns scheduling output only. |
| `calendar` | Calendars, events, availability, sync | Single source of truth for time. |
| `project` | Projects, milestones, objectives | Long-term outcomes; progress always derived. |
| `health` | Sleep, recovery, hydration, nutrition, body | Deterministic wellness OS. |
| `journal` | Entries, reflections, reviews | Most personal free text; reviews rule-based. |
| `finance` | Accounts, transactions, budgets, subscriptions | Balances derived from signed transactions. |
| `goal` | Goals, objectives, key results, habits | Outcomes, not work; progress = objectives×0.7 + habits×0.3. |
| `timeline` | Append-only unified event history | References entities, never owns them. |
| `analytics` | Metric snapshots + reviews | Consumes Timeline + summaries; never owns source data. |
| `tomorrow` | Tomorrow plans/priorities/checklist/reviews | Evening planning workflow; orchestrates, owns the plan. |
| `focus` | Focus sessions | Deep-work execution state; metrics derived. |
| `notification` | Notifications + preferences | Platform engine; modules supply signals, rules decide. |
| `automation` | Automation rules/conditions/history | Event-driven platform; actions call existing services. |
| `orchestration` | Pipeline runs + recovery | Cross-module scheduling; most steps are deterministic acks. |
| `knowledge` | Notes, flashcards, reading, research | Second brain; extends Journal. |
| `life` | Habits, routines, workouts, medications | Personal-growth layer; owns no health logic. |
| `resource` | Investments, assets, insurance, documents, CRM | System of record; extends Finance via one bridge. |
| `intelligence` | Dashboard config + review snapshots | Executive layer; **composition not duplication** — imports no other core. |

## Ownership rules

- **Write through the owner.** A cross-domain action (e.g. Automation firing a notification) calls
  the owning domain's *service*, never its tables directly.
- **Read through read models.** Consumers read `summary`/`signals`/`portfolio`/`dashboard`
  functions, which return aggregated, classified-safe views. See
  [integrations.md](./integrations.md).
- **Extensions, not replacements.** Life extends Health/Goals; Resource extends Finance; Knowledge
  extends Journal; Intelligence composes everything. None duplicates the data it builds on.
