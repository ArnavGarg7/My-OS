# 05 — Database Design

**Engine:** PostgreSQL 16 + `pgvector`. ORM: Drizzle (schema in `packages/db/src/schema/*`, one file per domain). This document is the source of truth for shape; DDL below is Postgres-flavored and maps 1:1 to Drizzle definitions.

## 0. Conventions

- **PKs:** `id uuid PRIMARY KEY` — UUIDv7 generated app-side (time-ordered ⇒ index-friendly).
- **Timestamps:** `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()` (trigger-updated). Soft delete via `deleted_at timestamptz NULL` on all user-content tables (marked ⌫ below); every read query filters `deleted_at IS NULL`; nightly purge after 30 days.
- **Day bucketing:** columns named `local_date date` store the user-TZ calendar day at write time (habits, water, sleep, journal, meals, work logs) — immune to later TZ changes.
- **`origin`:** `origin_enum('user','ai','automation','import','system') DEFAULT 'user'` on content tables (marked ◈).
- **Money:** `amount_minor bigint` (paise/cents) + global currency in settings. **Durations:** integer minutes. **Weights/volumes:** canonical metric (`weight_kg numeric(5,2)`, `volume_ml int`).
- **Enums** are Postgres enums (listed inline). **JSONB** payloads carry a `v` version field.
- Single user ⇒ no `user_id` on domain tables (only on auth tables). If multi-user ever arrives, add `user_id` + RLS (documented in 09).

### Entity relationship overview (text)

```
areas ─┬─< projects ─┬─< project_milestones
       │             ├─< project_resources
       │             └─< tasks >── task_dependencies
       ├─< tasks ──< time_blocks >── day_plans
       ├─< events ──< event_instances / event_reminders
       ├─< notes >── note_links          areas ─< goals ─< goal_checkins / goal_links
       └─< habits ──< habit_logs
semesters ─< courses ─┬─< class_sessions ─< class_session_instances
                      ├─< assignments (→ auto task)      exams
internships ─< work_logs
routines ─< routine_steps / routine_runs
exercises ─< workout_exercises >─ workouts >─ workout_templates ; workout_sets
foods ─< meal_logs ; weight_logs ; water_logs ; sleep_logs
accounts/finance_categories ─< transactions ; budgets ; subscriptions ─ savings_goals ─< savings_contributions
journal_entries ; weekly_plans ; monthly_reviews ; life_events
inbox_items ; energy_logs ; seasons ; focus_sessions ; projects ─< project_stash
automations ─< automation_runs ; notifications ─< notification_deliveries
ai_conversations ─< ai_messages ; ai_actions ; ai_memories ; embeddings (polymorphic)
users ─< sessions / login_attempts / webauthn_credentials ; user_settings ; push_subscriptions
files ; tags + entity_tags (polymorphic) ; activity_log ; domain_events ; backup_runs ; export_jobs / import_jobs ; ai_usage_log
```

---

## 1. Auth & System

```sql
users (id, name text NOT NULL, email citext UNIQUE NOT NULL, password_hash text NOT NULL,
       recovery_key_hash text NOT NULL, avatar_file_id uuid NULL → files,
       timezone text NOT NULL DEFAULT 'Asia/Kolkata', created_at, updated_at)         -- exactly 1 row

sessions (id, user_id → users ON DELETE CASCADE, token_hash bytea UNIQUE NOT NULL,
          user_agent text, ip inet, remember bool NOT NULL DEFAULT false,
          expires_at timestamptz NOT NULL, last_seen_at timestamptz, created_at)
  IX sessions(token_hash), sessions(expires_at)

login_attempts (id, email citext, ip inet, success bool, created_at)
  IX login_attempts(ip, created_at DESC)

webauthn_credentials (id, user_id →, credential_id bytea UNIQUE, public_key bytea,
                      counter bigint, device_name text, created_at, last_used_at)

user_settings (user_id PK → users, data jsonb NOT NULL DEFAULT '{}', updated_at)
  -- zod-validated document: appearance, planning defaults, day bounds, quiet hours,
  -- notification matrix, health targets, finance prefs, AI prefs. Unknown keys rejected.

push_subscriptions (id, endpoint text UNIQUE NOT NULL, keys_p256dh text, keys_auth text,
                    device_name text, platform text, created_at, last_success_at, failed_count int DEFAULT 0)

files (id ⌫, kind file_kind('image','audio','export','backup_meta'), path text NOT NULL, mime text,
       size_bytes int, width int, height int, duration_seconds int NULL, created_at)

activity_log (id, entity_type text NOT NULL, entity_id uuid NOT NULL,
              action text NOT NULL,                -- created|updated|completed|deleted|restored|status_changed…
              summary text, diff jsonb, actor origin_enum NOT NULL DEFAULT 'user', created_at)
  IX activity_log(entity_type, entity_id, created_at DESC), activity_log(created_at DESC)
  -- append-only; powers "last worked on", timeline derivation, reviews. Retention: forever.

domain_events (id bigserial PK, type text NOT NULL, payload jsonb NOT NULL,
               created_at, processed_at timestamptz NULL)
  IX domain_events(processed_at) WHERE processed_at IS NULL      -- transactional outbox (04 §8)

backup_runs (id, kind text('nightly','manual','verify'), status text('ok','failed'),
             size_bytes bigint, location text, error text, started_at, finished_at)

export_jobs (id, status text('pending','running','done','failed'), scope jsonb,
             file_id uuid NULL → files, error text, created_at, finished_at)
import_jobs (id, status, source_filename text, mapping jsonb, dry_run_report jsonb,
             result_report jsonb, error text, created_at, finished_at)

ai_usage_log (id, day date NOT NULL, feature text NOT NULL,      -- assistant|planner|summary|embedding|…
              model text, input_tokens int, output_tokens int, cache_read_tokens int,
              cost_minor bigint, created_at)
  IX ai_usage_log(day)
```

## 2. Organization Primitives

```sql
areas (id ⌫, name text NOT NULL, color text NOT NULL, icon text NOT NULL,
       sort int NOT NULL, is_archived bool DEFAULT false, created_at, updated_at)

tags (id, name citext UNIQUE NOT NULL, created_at)
entity_tags (tag_id → tags CASCADE, entity_type text, entity_id uuid,
             PRIMARY KEY (tag_id, entity_type, entity_id))
  IX entity_tags(entity_type, entity_id)      -- polymorphic: no FK to target (accepted tradeoff)
```

## 3. Tasks & Projects

```sql
tasks (id ⌫ ◈, title text NOT NULL, description jsonb NULL,        -- Tiptap doc
       status task_status('inbox','todo','in_progress','done','cancelled') DEFAULT 'inbox',
       priority smallint NOT NULL DEFAULT 2,                        -- 0..3 = P0..P3
       due_at timestamptz NULL, due_has_time bool DEFAULT false,
       scheduled_date date NULL,
       estimate_minutes int NULL, actual_minutes int NOT NULL DEFAULT 0,
       energy energy_enum('deep','light','admin') NULL,
       area_id uuid NULL → areas SET NULL, project_id uuid NULL → projects SET NULL,
       milestone_id uuid NULL → project_milestones SET NULL,
       parent_task_id uuid NULL → tasks CASCADE,                    -- one level (app-enforced)
       sort_order double precision NOT NULL DEFAULT 0,              -- fractional manual ordering
       recurrence_rule text NULL, recurrence_parent_id uuid NULL → tasks,
       roll_forward bool DEFAULT false,
       ticket_ref text NULL,                                        -- internship chip
       source_type text NULL, source_id uuid NULL,                  -- e.g. 'assignment'
       completed_at timestamptz NULL, created_at, updated_at, deleted_at)
  IX tasks(status) WHERE deleted_at IS NULL
  IX tasks(due_at) WHERE status NOT IN ('done','cancelled') AND deleted_at IS NULL
  IX tasks(scheduled_date), tasks(project_id), tasks(area_id), tasks(parent_task_id)
  IX tasks(source_type, source_id)
  -- FTS: ts tsvector GENERATED (title + description text) STORED; GIN(ts)

task_dependencies (task_id → tasks CASCADE, blocked_by_task_id → tasks CASCADE,
                   PRIMARY KEY (task_id, blocked_by_task_id), CHECK (task_id <> blocked_by_task_id))
  -- cycle check in app layer on insert

projects (id ⌫ ◈, name text NOT NULL, area_id → areas SET NULL, goal_statement text,
          description jsonb, status project_status('active','paused','done','archived') DEFAULT 'active',
          deadline date NULL, progress_mode text('auto','manual') DEFAULT 'auto',
          progress_manual smallint NULL,                            -- 0..100
          current_blocker text NULL, blocker_set_at timestamptz NULL,
          current_focus text NULL, focus_set_at timestamptz NULL,
          brain_dump jsonb NULL,                                    -- Tiptap doc (append-forever)
          scratchpad jsonb NULL,                                    -- Tiptap doc (working memory)
          completed_at timestamptz, created_at, updated_at, deleted_at)
  IX projects(status, area_id); FTS on name+goal_statement

project_milestones (id ⌫, project_id → projects CASCADE, title text NOT NULL,
                    target_date date NULL, sort int, done_at timestamptz NULL, created_at, updated_at)

project_resources (id ⌫, project_id → projects CASCADE, kind text('url','note'),
                   title text, url text NULL, note_id uuid NULL → notes, sort int, created_at)

project_stash (id ⌫, project_id → projects CASCADE, kind text('idea','parking'),
               text text NOT NULL, revisit_on date NULL,             -- parking-lot resurfacing (DecisionCard)
               resolved_at timestamptz NULL, promoted_task_id uuid NULL → tasks SET NULL,
               sort int, created_at, updated_at, deleted_at)
  IX project_stash(project_id, kind); IX project_stash(revisit_on) WHERE resolved_at IS NULL
```

## 4. Calendar

```sql
events (id ⌫ ◈, title text NOT NULL, description text, location text,
        area_id → areas SET NULL, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
        all_day bool DEFAULT false, rrule text NULL, exdates timestamptz[] DEFAULT '{}',
        is_critical bool DEFAULT false,                              -- quiet-hours override
        source_type text NULL, source_id uuid NULL,                  -- 'class_session'
        created_at, updated_at, deleted_at, CHECK (ends_at > starts_at))
  IX events(starts_at), events(area_id); FTS on title+description+location

event_instances (id, event_id → events CASCADE, starts_at timestamptz NOT NULL,
                 ends_at timestamptz NOT NULL, is_override bool DEFAULT false,
                 override jsonb NULL,                                -- changed fields for this occurrence
                 cancelled bool DEFAULT false, UNIQUE (event_id, starts_at))
  IX event_instances(starts_at)          -- materialized 12 months ahead (04 §6)

event_reminders (id, event_id → events CASCADE, offset_minutes int NOT NULL,  -- 0,5,15,…, custom
                 created_at)
```

## 5. Planner

```sql
day_plans (id, date date UNIQUE NOT NULL,
           status plan_status('draft','accepted','reviewed') NOT NULL,
           generated_by origin_enum, planned_night_before bool DEFAULT false,
           generation_meta jsonb NULL,        -- model, rationale summary, unplaced tasks
           accepted_at timestamptz, created_at, updated_at)

time_blocks (id ◈, plan_date date NOT NULL,                          -- denormalized key (fast day fetch)
             day_plan_id uuid NULL → day_plans CASCADE,
             type block_type('task','event','focus','break','routine','buffer','custom'),
             title text NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
             task_id uuid NULL → tasks SET NULL, event_instance_id uuid NULL → event_instances SET NULL,
             routine_id uuid NULL → routines SET NULL,
             status block_status('planned','active','done','skipped','missed') DEFAULT 'planned',
             skip_reason text NULL, rationale text NULL,
             actual_start timestamptz, actual_end timestamptz, notes text,
             is_draft bool DEFAULT false, created_at, updated_at,
             CHECK (ends_at > starts_at))
  IX time_blocks(plan_date), time_blocks(task_id), time_blocks(status) WHERE status='active'
```

## 6. College & Internship

```sql
semesters (id ⌫, name text, starts_on date, ends_on date, is_active bool DEFAULT false)
courses (id ⌫, semester_id → semesters CASCADE, code text, name text, color text,
         instructor text, credits numeric(3,1), target_grade text, final_grade text NULL,
         created_at, updated_at, deleted_at)
class_sessions (id ⌫, course_id → courses CASCADE, weekday smallint,     -- 0=Mon
                starts_time time, ends_time time, room text)
class_session_instances (id, class_session_id → CASCADE, date date, cancelled bool DEFAULT false,
                         attendance attendance_enum('attended','missed','cancelled') NULL,
                         UNIQUE (class_session_id, date))
  IX class_session_instances(date)
assignments (id ⌫ ◈, course_id → courses CASCADE, title text, due_at timestamptz,
             effort_minutes int, status text('todo','in_progress','done') DEFAULT 'todo',
             grade text NULL, task_id uuid NULL → tasks SET NULL, created_at, updated_at, deleted_at)
exams (id ⌫, course_id → courses CASCADE, title text, starts_at timestamptz, location text,
       syllabus jsonb DEFAULT '[]',            -- [{text, done}]
       target_grade text, grade text NULL, created_at, updated_at, deleted_at)

internships (id ⌫, company text, role text, manager text, starts_on date, ends_on date NULL,
             weekdays smallint[] DEFAULT '{0,1,2,3,4}', work_start time, work_end time,
             is_archived bool DEFAULT false)
work_logs (id ⌫, internship_id → internships CASCADE, local_date date, bullets jsonb DEFAULT '[]',
           learnings jsonb DEFAULT '[]', hours numeric(3,1), UNIQUE (internship_id, local_date))
```

## 7. Notes & Journal

```sql
notes (id ⌫ ◈, title text NOT NULL DEFAULT 'Untitled', content jsonb,     -- Tiptap
       content_text text,                       -- extracted plain text (for FTS/embeddings), trigger-maintained
       area_id → areas SET NULL, project_id → projects SET NULL,
       pinned bool DEFAULT false, favorite bool DEFAULT false,
       created_at, updated_at, deleted_at)
  FTS GIN on to_tsvector(title || content_text); IX notes(updated_at DESC), notes(project_id)

note_links (from_note_id → notes CASCADE, to_type text('note','task','project'),
            to_id uuid, PRIMARY KEY (from_note_id, to_type, to_id))
  IX note_links(to_type, to_id)                 -- backlinks

journal_entries (id ⌫, local_date date UNIQUE NOT NULL, mood smallint NULL CHECK (1..5),
                 feelings text[] DEFAULT '{}', wins jsonb DEFAULT '[]', lessons jsonb DEFAULT '[]',
                 gratitude jsonb DEFAULT '[]', reflection jsonb NULL, reflection_text text,
                 prompt_shown text, completed bool DEFAULT false, created_at, updated_at, deleted_at)
  IX journal_entries(local_date DESC); FTS on reflection_text
```

## 8. Habits & Routines

```sql
habits (id ⌫, name text, icon text, color text, area_id → areas SET NULL,
        kind habit_kind('boolean','quantity'), unit text NULL, target_qty numeric NULL,
        schedule jsonb NOT NULL,               -- {type:'daily'|'weekdays'|'times_per_week', days:[..], times:n}
        time_of_day text('morning','afternoon','evening','anytime') DEFAULT 'anytime',
        reminder_time time NULL, start_date date, sort int,
        goal_id uuid NULL → goals SET NULL, is_water bool DEFAULT false,   -- the built-in water habit
        archived_at timestamptz NULL, created_at, updated_at, deleted_at)

habit_logs (id, habit_id → habits CASCADE, local_date date NOT NULL,
            status habit_log_status('done','skipped','missed'), qty numeric NULL,
            skip_reason text NULL, logged_at timestamptz, UNIQUE (habit_id, local_date))
  IX habit_logs(local_date)
  -- streaks computed in packages/core (windowed queries), cached column habits.current_streak int, best_streak int
  -- maintained by rollover job + log mutations

routines (id ⌫, name text, icon text, schedule jsonb,               -- same shape as habits.schedule
          anchor_time time NOT NULL, created_at, updated_at, deleted_at)
routine_steps (id, routine_id → routines CASCADE, title text, duration_minutes int, sort int)
routine_runs (id, routine_id → CASCADE, local_date date, step_states jsonb,   -- [{stepId,done}]
              completed bool DEFAULT false, UNIQUE (routine_id, local_date))
```

## 9. Health

```sql
exercises (id ⌫, name text, muscle_group text, kind text('strength','cardio','mobility'),
           unit_scheme text('weight_reps','time','distance'), is_custom bool DEFAULT false)

workout_templates (id ⌫, name text, notes text, sort int, created_at, updated_at, deleted_at)
workout_template_exercises (id, template_id → CASCADE, exercise_id → exercises,
                            sort int, default_sets int, default_reps int, default_weight_kg numeric(6,2))

workouts (id ⌫, template_id uuid NULL → workout_templates SET NULL, local_date date NOT NULL,
          started_at timestamptz, ended_at timestamptz, duration_minutes int,
          status text('active','draft','done') DEFAULT 'done', notes text, created_at, updated_at, deleted_at)
  IX workouts(local_date DESC)
workout_exercises (id, workout_id → workouts CASCADE, exercise_id → exercises, sort int)
workout_sets (id, workout_exercise_id → CASCADE, set_no int, weight_kg numeric(6,2) NULL,
              reps int NULL, seconds int NULL, distance_m int NULL, rpe numeric(3,1) NULL,
              is_pr bool DEFAULT false)

weight_logs (id, local_date date NOT NULL, weight_kg numeric(5,2) NOT NULL, note text,
             logged_at timestamptz, created_at)          -- multiple/day allowed; latest wins for charts
  IX weight_logs(local_date DESC)

water_logs (id, local_date date NOT NULL, volume_ml int NOT NULL, logged_at timestamptz NOT NULL)
  IX water_logs(local_date)

sleep_logs (id, wake_date date UNIQUE NOT NULL, bed_at timestamptz NOT NULL,
            woke_at timestamptz NOT NULL, quality smallint CHECK (1..5), note text,
            duration_minutes int GENERATED, created_at, updated_at)

foods (id ⌫, name text, kcal int, protein_g numeric(6,1), carbs_g numeric(6,1), fat_g numeric(6,1),
       favorite bool DEFAULT false, last_used_at timestamptz, use_count int DEFAULT 0)
meal_logs (id, local_date date NOT NULL, meal meal_enum('breakfast','lunch','dinner','snack'),
           name text NOT NULL, food_id uuid NULL → foods SET NULL,     -- values snapshotted:
           kcal int NULL, protein_g numeric NULL, carbs_g numeric NULL, fat_g numeric NULL,
           logged_at timestamptz, created_at)
  IX meal_logs(local_date)
```

## 10. Finance

```sql
accounts (id ⌫, name text, kind text('cash','bank','credit','wallet'), starting_minor bigint DEFAULT 0,
          sort int, archived bool DEFAULT false)
finance_categories (id ⌫, name text, parent_id uuid NULL → finance_categories, color text, icon text,
                    flow text('expense','income') NOT NULL, sort int)
transactions (id ⌫ ◈, kind txn_kind('expense','income','transfer'), amount_minor bigint NOT NULL,
              account_id → accounts, transfer_account_id uuid NULL → accounts,
              category_id uuid NULL → finance_categories SET NULL,
              local_date date NOT NULL, merchant text, note text,
              subscription_id uuid NULL → subscriptions SET NULL, created_at, updated_at, deleted_at)
  IX transactions(local_date DESC), transactions(category_id, local_date), transactions(account_id)
  FTS on merchant+note
budgets (id, month date NOT NULL,                       -- first of month
         category_id uuid NULL → finance_categories,    -- NULL = overall cap
         amount_minor bigint NOT NULL, UNIQUE (month, category_id))
subscriptions (id ⌫, name text, amount_minor bigint, cycle text('monthly','yearly','custom'),
               cycle_days int NULL, next_renewal date NOT NULL, account_id → accounts,
               category_id → finance_categories, active bool DEFAULT true,
               remind_days_before int DEFAULT 3, created_at, updated_at, deleted_at)
savings_goals (id ⌫, name text, target_minor bigint, target_date date NULL,
               achieved_at timestamptz NULL, created_at, updated_at, deleted_at)
savings_contributions (id, savings_goal_id → CASCADE, amount_minor bigint, local_date date, note text)
```

## 11. Goals, Reviews, Timeline

```sql
goals (id ⌫, title text, why text, area_id → areas SET NULL, target_date date NULL,
       metric goal_metric('checklist','number','habit','manual'),
       number_start numeric NULL, number_target numeric NULL, number_unit text NULL,
       number_source text NULL,                 -- 'weight' wires to weight_logs
       manual_progress smallint DEFAULT 0,
       status goal_status('active','achieved','missed','dropped') DEFAULT 'active',
       achieved_at timestamptz, created_at, updated_at, deleted_at)
goal_links (goal_id → goals CASCADE, entity_type text('project','habit'), entity_id uuid,
            PRIMARY KEY (goal_id, entity_type, entity_id))
goal_checkins (id, goal_id → goals CASCADE, note text, progress_snapshot numeric, created_at)

weekly_plans (id, week_start date UNIQUE, last_week_stats jsonb, narrative text,
              win text, drag text, priorities jsonb,        -- [{text, entityRef?, done}]
              focus_hours_target int, workouts_target int, completed_at timestamptz, created_at, updated_at)

monthly_reviews (id, month date UNIQUE, report jsonb NOT NULL,     -- denormalized snapshot of all stats
                 narrative text, suggestions jsonb, proud_of text, struggled_with text,
                 change_next text, sealed_at timestamptz, created_at, updated_at)

life_events (id ⌫, kind text NOT NULL,          -- project_done|milestone|goal_achieved|exam|pr|weight_milestone|
                                                -- streak|semester|internship|anniversary|manual
             title text, description text, icon text, local_date date NOT NULL,
             source origin_enum, entity_type text NULL, entity_id uuid NULL,
             cluster_key text NULL,             -- same-kind clustering (PRD §22)
             photo_file_id uuid NULL → files, created_at, deleted_at)
  IX life_events(local_date DESC); UNIQUE (kind, entity_type, entity_id) WHERE entity_id IS NOT NULL
```

## 11A. Decision Context — Energy, Seasons, Focus, Inbox

```sql
energy_logs (id, local_date date NOT NULL, period text('morning','midday') DEFAULT 'morning',
             level smallint NOT NULL CHECK (level BETWEEN 1 AND 3),   -- 1 low, 2 medium, 3 high
             note text, logged_at timestamptz, UNIQUE (local_date, period))
  IX energy_logs(local_date DESC)

seasons (id ⌫, name text NOT NULL,
         kind text NOT NULL,        -- exam_week|internship_crunch|hackathon|placement_prep|gym_cut|
                                    -- gym_bulk|travel|recovery|normal|custom
         starts_on date NOT NULL, ends_on date NULL,
         config jsonb NOT NULL,     -- {areaWeights:{areaId:mult}, plannerOverrides:{deepWorkCapMin,…},
                                    --  protectedBlockTypes:[], notificationProfile:{mutedTypes:[]},
                                    --  pausableHabitIds:[], briefingOrder?:[]}
         retro text NULL, created_at, updated_at, deleted_at)
  -- exactly one active (starts_on ≤ today ≤ ends_on/null, latest wins) — app-enforced on declare
  IX seasons(starts_on DESC)

focus_sessions (id, task_id uuid NULL → tasks SET NULL, time_block_id uuid NULL → time_blocks SET NULL,
                title text, local_date date NOT NULL,
                started_at timestamptz NOT NULL, ended_at timestamptz NULL,
                planned_minutes int NULL, focused_minutes int NULL,
                interruptions int NOT NULL DEFAULT 0, interruption_reasons jsonb DEFAULT '[]',
                notes text, last_heartbeat_at timestamptz, created_at)
  IX focus_sessions(local_date DESC); IX focus_sessions(ended_at) WHERE ended_at IS NULL
  -- open sessions drive notification focus-hold (04 §7); rollover closes stale ones at last_heartbeat+1m

inbox_items (id ⌫ ◈, kind text('text','link','image','audio'),
             content text NULL, url text NULL, title text NULL,      -- title = fetched link title
             file_id uuid NULL → files SET NULL,
             status text('new','processed','archived') DEFAULT 'new',
             processed_to jsonb NULL,                                -- {entityType, entityId}
             created_at, updated_at, deleted_at)
  IX inbox_items(status) WHERE status='new'; IX inbox_items(created_at DESC)
```

## 12. Automations & Notifications

```sql
automations (id ⌫, name text NOT NULL, enabled bool DEFAULT true, is_builtin bool DEFAULT false,
             builtin_key text UNIQUE NULL,      -- 'water_pacing', 'morning_digest', …
             trigger jsonb NOT NULL,            -- {type:'schedule',rrule}|{type:'event',event:'task.overdue'}…
             conditions jsonb DEFAULT '[]', actions jsonb NOT NULL,
             cooldown_minutes int DEFAULT 15, last_fired_at timestamptz,
             error text NULL, created_at, updated_at, deleted_at)
automation_runs (id, automation_id → CASCADE, fired_at timestamptz, trigger_snapshot jsonb,
                 outcome text('actions_run','conditions_failed','error','dry_run'), output jsonb, error text)
  IX automation_runs(automation_id, fired_at DESC)   -- retention: last 100/rule

notifications (id, type notif_type NOT NULL,          -- enum per PRD FR-NOTIF-2
               title text NOT NULL, body text, url text,
               scheduled_for timestamptz NOT NULL,
               status notif_status('scheduled','enqueued','sent','held','snoozed','cancelled','acted') ,
               silent bool DEFAULT false, critical bool DEFAULT false,
               source_type text, source_id uuid,       -- rule/entity that produced it ("why?")
               dedupe_key text,                        -- type:entity:minute
               payload jsonb,                          -- actions, icons
               read_at timestamptz NULL, acted_at timestamptz NULL, sent_at timestamptz NULL,
               created_at)
  IX notifications(status, scheduled_for) WHERE status IN ('scheduled','snoozed')
  IX notifications(created_at DESC); UNIQUE (dedupe_key) WHERE dedupe_key IS NOT NULL
  -- doubles as history (retention 90d)

notification_deliveries (id, notification_id → CASCADE, channel text('inapp','push'),
                         subscription_id uuid NULL → push_subscriptions,
                         status text('ok','failed'), error text, delivered_at)
```

## 13. AI

```sql
ai_conversations (id ⌫, title text, context_page text NULL, created_at, updated_at, deleted_at)
ai_messages (id, conversation_id → CASCADE, role text('user','assistant'),
             content jsonb NOT NULL,             -- ordered blocks incl. tool_use/tool_result summaries
             citations jsonb DEFAULT '[]',       -- [{entityType, entityId, label}]
             model text, input_tokens int, output_tokens int, created_at)
  IX ai_messages(conversation_id, created_at)

ai_actions (id, conversation_id uuid NULL →, kind text NOT NULL,   -- create_tasks|day_plan|reschedule|…
            payload jsonb NOT NULL, preview jsonb,
            status text('proposed','accepted','edited_accepted','rejected','expired') DEFAULT 'proposed',
            applied_entity_refs jsonb NULL, resolved_at timestamptz, expires_at timestamptz, created_at)
  IX ai_actions(status) WHERE status='proposed'

ai_memories (id ⌫, kind text('fact','preference','pattern'), content text NOT NULL,
             source text('user_told','inferred_confirmed'), confidence numeric(3,2),
             last_used_at timestamptz, use_count int DEFAULT 0, created_at, updated_at, deleted_at)

embeddings (id, entity_type text NOT NULL,       -- task|project|note|journal|event|goal|workout_note
            entity_id uuid NOT NULL, chunk_no int DEFAULT 0,
            content_hash bytea NOT NULL,          -- skip re-embed when unchanged
            content text NOT NULL, embedding vector(1024) NOT NULL,   -- voyage-3.5-lite
            updated_at, UNIQUE (entity_type, entity_id, chunk_no))
  IX embeddings USING hnsw (embedding vector_cosine_ops)
```

## 14. Index & Query Strategy

- **Hot paths and their indexes:** today view (`tasks(due_at) partial`, `tasks(scheduled_date)`, `time_blocks(plan_date)`, `event_instances(starts_at)`); notification scanner (`notifications(status, scheduled_for) partial`) + focus-hold check (`focus_sessions(ended_at) partial`); habit day grid (`habit_logs(local_date)`); finance month (`transactions(local_date)`, `(category_id, local_date)`); analytics (`focus_sessions(local_date)`, hour-bucketed aggregates computed query-time — no precomputed rollups in V1); search (GIN FTS per table + HNSW on embeddings).
- **FTS:** generated `tsvector` columns (`simple` + `english` config concatenated) on tasks, notes, journal, events, projects, transactions; one `search_all()` SQL function UNIONs ranked per-table queries (limit 3/group) for the palette.
- **Counts/badges:** cheap partial-index counts (overdue, unread) — no denormalized counters except habit streak cache.
- All FKs indexed. `EXPLAIN` review is part of the roadmap's perf stage.

## 15. Data Flow Summaries

- **Write path:** tRPC mutation → transaction: domain rows + `activity_log` + `domain_events` → commit → pg NOTIFY → web SSE invalidation; worker outbox consumer → automations / timeline / embeddings / notifications.
- **Planner day fetch:** one query per day: blocks (by `plan_date`) + event_instances (range) + tasks (scheduled/due) — composed server-side into a `DayView` DTO.
- **Rollover job (00:05 local):** finalize yesterday: missed blocks, habit misses (per schedule expectation — season-pausable habits become `skipped`), auto-finish abandoned live workouts, close stale focus sessions (at `last_heartbeat_at`+1m), day_plan → `reviewed` if untouched, streak cache update, task.overdue domain events, season auto-revert when `ends_on` passed.
- **Materializer (03:00):** extend event/class/task recurrences to horizon; subscriptions scan (renewals → transactions + reminders).

## 16. Backup Strategy (DB view)

- Nightly 02:30 `pg_dump -Fc` (custom format, compressed) + `/data/uploads` tar. Encrypt with `age` (key in server env, copy stored offline by user). Local retention 7 daily/4 weekly/6 monthly; remote copy to S3-compatible bucket (versioned).
- Weekly verify: restore into `verify` schema in a scratch database, run row-count + FK sanity script, record in `backup_runs`.
- Pre-deploy and pre-restore dumps are mandatory (scripted).
- Restore runbook: `infra/runbooks/restore.md` — stop worker → maintenance page → `pg_restore --clean` → migrate → smoke script → resume.
- RPO: 24h (acceptable, single user); RTO target: < 30 min.

## 17. Retention & Purge Jobs

| Data | Policy |
|---|---|
| Soft-deleted rows | purge 30 days after `deleted_at` (nightly) |
| notifications | 90 days |
| automation_runs | last 100 per rule |
| domain_events | processed rows purged after 14 days |
| login_attempts | 30 days |
| export files | 7 days |
| activity_log, logs of record (habits, health, finance, journal, energy, focus sessions, seasons) | forever |
| inbox_items (archived) | 1 year, then purged |
