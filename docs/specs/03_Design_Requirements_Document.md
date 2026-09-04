# 03 — Design Requirements Document (DRD)

**Project:** My OS
**Scope:** the complete visual and interaction specification. A frontend engineer (or AI) should be able to build every screen from this document plus the PRD, without inventing design decisions.

Lineage: **Linear** (density, keyboard-first, list craft), **Arc** (calm chrome, personality in small moments), **Raycast** (command palette as front door), **Apple** (polish, motion restraint).

---

## 1. Design Principles

1. **Dark-first.** Dark is the default and the reference design; light theme is a derived mapping (tokens below define both).
2. **Density with hierarchy.** 13px base UI type, tight rows — legible through alignment, weight and spacing, not size.
3. **One accent.** Indigo does all interactive work. Semantic colors (red/amber/green/blue) only for meaning, never decoration.
4. **Motion explains, never entertains.** 120–300ms, ease-out, mostly translate/fade. Anything decorative must pass "does it clarify state change?"
5. **Keyboard is a first-class citizen.** Every interactive element is reachable and operable; shortcuts are discoverable (`⌘/` overlay, hints in tooltips and palette).
6. **Empty states teach.** Every empty view sells the feature in one sentence + one primary action + the relevant shortcut.

## 2. Design Tokens

Implemented as CSS custom properties on `:root[data-theme=dark|light]`; Tailwind maps semantic names → variables. **Never hardcode hex in components.**

### 2.1 Color — Dark (reference)

| Token | Hex | Use |
|---|---|---|
| `--bg-base` | `#0A0A0C` | App background |
| `--bg-surface` | `#111113` | Cards, sidebar, panels |
| `--bg-elevated` | `#18181C` | Popovers, modals, hover-raised cards |
| `--bg-overlay` | `#1F1F24` | Menus, tooltips |
| `--bg-inset` | `#0D0D10` | Wells, input backgrounds, code blocks |
| `--border-subtle` | `#26262B` | Default hairlines (1px) |
| `--border-strong` | `#3A3A42` | Focused/hover borders, dividers needing weight |
| `--text-primary` | `#F4F4F5` | Headings, primary content |
| `--text-secondary` | `#A1A1AA` | Labels, metadata |
| `--text-tertiary` | `#6E6E78` | Hints, placeholders, disabled-adjacent |
| `--text-disabled` | `#4A4A52` | Disabled |
| `--accent` | `#6E7BFF` | Primary actions, links, active nav, focus |
| `--accent-hover` | `#8089FF` | Hover on accent |
| `--accent-muted` | `rgba(110,123,255,.14)` | Selected rows, active-nav bg, chips |
| `--success` | `#3ECF6E` | Done, positive deltas, streaks |
| `--warning` | `#F5B83D` | At-risk, 80% budget, warnings |
| `--danger` | `#F4564A` | Overdue, destructive, errors |
| `--info` | `#4CC3E8` | Neutral info, tips |
| Priority scale | P0 `#F4564A` · P1 `#F5A83D` · P2 `#6E7BFF` · P3 `#6E6E78` | Task priority dots/chips |
| Mood scale (1→5) | `#F4564A · #F5A83D · #E8D44C · #7BC96F · #3ECF6E` | Journal heatmap |
| Chart series | `#6E7BFF #4CC3E8 #3ECF6E #F5B83D #C77BF4 #F4708B` | In order |
| Area defaults | Personal `#6E7BFF` · College `#4CC3E8` · Internship `#C77BF4` · Health `#3ECF6E` · Finance `#F5B83D` | User-changeable |

Light theme: base `#FAFAFB`, surface `#FFFFFF`, elevated `#FFFFFF`+shadow, borders `#E4E4E9/#C9C9D2`, text `#17171C/#565660/#8A8A94`, same accent/semantics darkened ~8% for contrast. All pairs verified ≥ 4.5:1 for text, ≥ 3:1 for large text/icons.

### 2.2 Typography

- **UI:** Inter (variable), features `cv05, ss01, tnum` where numeric. **Numeric/data & code:** JetBrains Mono.
- Scale (px/line-height/weight): `display 28/34/650` (page heroes, big numbers) · `title 20/28/600` (page titles) · `heading 16/24/600` (section heads) · `body-lg 14/22/450` (editor prose) · `body 13/20/450` (default UI) · `label 12/16/500` (form labels, column heads, uppercase +0.4px tracking optional) · `micro 11/14/500` (timestamps, badges) · `mono 12/18/450` (amounts, durations, times).
- Rules: page has exactly one `title`; numbers in tables/charts always `tnum` or mono; never bold whole paragraphs.

### 2.3 Spacing, radius, elevation

- **Grid:** 4px base. Component paddings from {4,8,12,16,20,24,32}. Page gutter 24 desktop / 16 mobile. Section gap 24. Card padding 16.
- **Radius:** `r-sm 4` (chips, checkboxes) · `r-md 6` (buttons, inputs) · `r-lg 8` (cards) · `r-xl 12` (modals, popovers) · `r-full` (pills, avatars, rings).
- **Elevation** (dark = border+scrim more than shadow): `e0` flat; `e1` card = 1px `--border-subtle`; `e2` popover = border + `0 4px 16px rgba(0,0,0,.4)`; `e3` modal = border + `0 12px 40px rgba(0,0,0,.55)` + page scrim `rgba(0,0,0,.6)`.

### 2.4 Motion

| Token | Value | Use |
|---|---|---|
| `dur-fast` | 120ms | Hover, press, checkbox, toggles |
| `dur-base` | 200ms | Panels, dropdowns, list insert/remove |
| `dur-slow` | 300ms | Modals, drawers, page transitions |
| `ease-out` | cubic-bezier(0.2, 0, 0, 1) | Entrances |
| `ease-in` | cubic-bezier(0.4, 0, 1, 1) | Exits |
| `spring` | stiffness 400, damping 30 | Drag-drop settle, Now-card timer ring |

`prefers-reduced-motion`: all transitions → 1ms fades; springs disabled; confetti/celebrations replaced by static state.

### 2.5 Iconography
Lucide icons, 16px default (20px in nav/empty states), stroke 1.75, `--text-secondary` default, accent when active. Feature glyphs: Today `sun` · Inbox `inbox` · Tasks `check-circle-2` · Planner `layout-list`(timeline) · Calendar `calendar` · Projects `folder-kanban` · College `graduation-cap` · Internship `briefcase` · Notes `file-text` · Journal `book-open` · Habits `repeat` · Health `heart-pulse` · Finance `wallet` · Goals `target` · Timeline `milestone` · Assistant `sparkles` · Analytics `bar-chart-3` · Automations `zap` · Notifications `bell` · Settings `settings` · Focus `focus` · Seasons `compass`.

---

## 3. App Shell & Layout

### 3.1 Desktop (≥1024px)
```
┌──────┬──────────────────────────────────────────┬─────────┐
│ Side │  Top bar (page title · date · actions)   │ (Drawer)│
│ bar  ├──────────────────────────────────────────┤  AI ⌘J  │
│ 232px│  Content (max 1200px, centered)          │  400px  │
│      │                                          │         │
└──────┴──────────────────────────────────────────┴─────────┘
```
- **Sidebar** (`--bg-surface`, collapsible to 56px icon rail via `⌘\`, state persisted): top = logo mark + user chip; nav groups: *(no header)* **Today**, Inbox (unprocessed-count badge), Planner, Calendar, Tasks, Notes · **Life** Journal, Habits, Health, Goals, Timeline · **Work** Projects, College, Internship, Finance · **System** Assistant, Analytics, Automations, Notifications (unread badge), Settings. Saved task views pinned under Tasks. Each item: icon + label + optional count badge; active = `--accent-muted` bg + accent icon + 2px accent left bar; hover = elevated bg. Bottom: collapse chevron + sync/offline indicator dot.
- **Top bar** (48px, transparent over base): breadcrumb/page title (title token), contextual date controls (Today button, ‹ › arrows, date picker) on time-based pages, right cluster: **SeasonChip** (when a non-Normal season is active) + **energy chip** (today's level; tap → re-log popover), page primary action button, search hint (`⌘K` pill), notification bell (popover, last 10 + See all), assistant spark (`⌘J`).
- **AI drawer**: 400px right overlay panel (e2), push-free (overlays content), resizable 360–560px.
- **Peek panel**: 480px right-side panel used for task/event/transaction detail — slides in `dur-base`, list stays interactive behind, `Esc` closes.

### 3.2 Tablet (640–1023px)
Sidebar defaults to icon rail; peek panels become full-width sheets; calendar defaults to Week→3-day.

### 3.3 Mobile (<640px)
- **Bottom tab bar** (56px, `--bg-surface`, top hairline): Today · Planner · **＋Capture** (center, raised 44px accent FAB) · Habits · More (sheet with full nav grid).
- Top bar shrinks to title + bell + avatar. Pages are single-column; tabs (Health, Finance) become swipeable segmented controls; hover interactions get explicit `⋯` menus; long-press = context menu; pull-to-refresh on feeds.
- Safe-area insets respected (iOS PWA).

### 3.4 PWA
Manifest: name "My OS", short_name "MyOS", `display: standalone`, `background_color #0A0A0C`, `theme_color #0A0A0C`, maskable icons 192/512 (▮ glyph on rounded square), app shortcuts: Capture to Inbox, Today, Log Water; **share_target** (POST: url/text/images → Life Inbox capture screen). iOS splash set generated. Install prompt: custom banner in Settings + after 3rd mobile visit.

---

## 4. Component Library

Conventions for every component: states = default · hover · active/pressed · focus-visible (2px accent ring, 2px offset) · disabled (50% opacity, no pointer) · loading where applicable. Touch targets ≥ 44px on mobile even when visually smaller.

### 4.1 Buttons
| Variant | Style | Use |
|---|---|---|
| **Primary** | accent bg, white text, r-md, h-32 (h-40 mobile), px-12 | One per view max |
| **Secondary** | `--bg-elevated` bg, border-subtle, text-primary | Common actions |
| **Ghost** | transparent, text-secondary → elevated bg on hover | Toolbars, icon+text |
| **Danger** | danger bg (confirm contexts) / danger text ghost (menus) | Destructive |
| **Icon** | 28×28 ghost square, tooltip mandatory | Compact toolbars |
Press = scale 0.98 + darken (dur-fast). Loading = spinner replaces label, width locked. With-shortcut buttons render a kbd hint chip inside on desktop hover.

### 4.2 Inputs & forms
- **Text/textarea:** inset bg, border-subtle → strong on hover → accent on focus; h-32; error state = danger border + 12px message below; inline validation on blur, on-change after first error.
- **Select/Combobox:** popover listbox (e2), typeahead, check on selected; multi-select renders token chips.
- **Date/time picker:** popover calendar + natural-language input ("next tue 5pm"), time in 5-min steps, quick chips (Today, Tomorrow, Next week, Weekend).
- **Checkbox:** 16px r-sm; task checkbox = 18px circle variant with priority-colored ring; check draws stroke 160ms.
- **Toggle:** 32×18 pill, accent on.
- **Slider:** for targets/progress override; value bubble on drag.
- **Segmented control:** for view switches (Month/Week/Day); animated thumb.
- **Stepper:** for quantities (water glasses, sets); press-and-hold accelerates.
- **Tag input:** free-form chips with autocomplete from existing tags.

### 4.3 Data display
- **Card:** surface bg, e1, r-lg, 16 padding, optional header row (heading + ghost actions).
- **List row (universal):** 36px (compact 32 / comfortable 40), grid: [control 24px][content 1fr][meta auto]; hover = elevated bg; selected = accent-muted; drag handle appears on hover at far left. Swipe actions mobile: right-swipe complete (green reveal), left-swipe snooze/delete (per list config).
- **TaskRow:** checkbox·title(+chips: priority dot, due date — red if overdue, area color dot, project name, ⛓ blocked, ↻ recurring, 📎subtasks n/m)·meta(estimate, kebab).
- **TimeBlock (planner):** rounded 6, 3px left bar in type color (task=accent, event=area color, focus=violet `#C77BF4`, break=success, routine=info, buffer=striped tertiary); title + time range (mono micro); status: planned=solid, active=pulsing left bar + timer, done=60% opacity + check, skipped=40% + strikethrough, draft(AI)=dashed border. Height ∝ duration (1min = 1.2px, min 24px).
- **EventChip (calendar month):** 18px pill, area color dot + truncated title.
- **HabitRing / ProgressRing:** SVG ring, 3px stroke, animated sweep on change (dur-slow, spring at end).
- **StatCard:** label (label token) + big number (display, mono for numeric) + delta chip (▲▼ colored) + sparkline (24px).
- **Charts (Recharts, themed):** line (2px, dot on hover only), bar (r-sm tops), area (accent 12% fill), heatmap (5-step scales), donut (donut hole shows total). Tooltip = overlay bg card, mono values. Axes: micro type, tertiary color, only horizontal gridlines (border-subtle). Empty chart = ghost illustration + "no data yet".
- **Badge/Chip:** micro type, r-full, muted bg of its semantic color. Streak chip = 🔥 + count.
- **Avatar:** initials on accent-muted.
- **Kbd:** 20px key caps, inset bg, border, mono 11.
- **EmptyState:** centered, 20px icon in accent-muted circle → one-line message (body, secondary) → primary action → kbd hint. Illustration = the ▮ mark playing a role (e.g., holding a checkmark) — single consistent motif.
- **Skeleton:** shimmering blocks matching final layout (rows, cards, rings); shimmer 1.2s linear; never spinners for content areas (spinners only inside buttons).

### 4.4 Feedback & overlays
- **Toast:** bottom-center (desktop) / above tab bar (mobile), overlay bg, icon + text + optional action (Undo), 5s (8s with action), stack max 3, swipe/`Esc` dismiss.
- **Modal:** centered, e3, max-w 480 (forms) / 720 (wizards), title + close ✕, footer right-aligned [Ghost cancel][Primary]. Enter = primary, Esc = cancel. Scale 0.97→1 + fade (dur-slow).
- **Confirm dialog:** modal variant; destructive confirms show consequence counts ("Deletes 1 project and 23 tasks") and require typing nothing (single-click) unless >50 rows affected → type entity name.
- **Sheet (mobile):** bottom sheet, drag-handle, snap points 50/90%.
- **Drawer:** right slide (AI, filters), dur-slow.
- **Popover/menu:** e2, 4px item padding, icons left, danger items last after divider, submenus fly right.
- **Tooltip:** 600ms delay, overlay bg, micro text, shortcut hint appended.
- **Command Center (⌘K):** 560px, top-20vh; input row (search icon, placeholder "Type a command or search anything…"); grouped results (commands first, then entities); row = icon+title+context path+kbd; ↑↓ navigate, Enter run, Tab into filters; recent commands section when empty; season-switch and Focus Mode commands always indexed. Backdrop blur 8px. Raycast-grade: every entity type and every action reachable from this one input.
- **Banner:** page-top strip for offline (tertiary), triage (warning), backup failure (danger).

### 4.5 AI components
- **ProposalCard:** violet-tinted border-left (3px `#C77BF4`), header "✨ Suggestion" + source, body = diff-style preview (green + rows for creations, arrows for changes), footer [Reject ghost][Edit][Accept primary]. Batch = stacked with "Accept all (n)".
- **AI message bubble:** no bubble for assistant (flat text, sparkles avatar), user messages right-aligned muted card. Tool-use shown as collapsible "🔍 read 12 tasks" chips. Streaming caret ▍blink.
- **Rationale hover:** planner draft blocks show ⓘ; hover/tap reveals one-line reason.

### 4.6 Decision & context components
- **DecisionCard:** situation line (body) → recommendation button (secondary-styled, verb-first, e.g. `Finish 3`) → ≤2 alternates (ghost) → cost-of-ignoring caption (micro, tertiary) → dismiss ✕ (logged). 3px left bar in the domain's semantic color. Max 2 stacked per view; overflow collapses into "n more decisions" row. Resolving: chosen button fills, card collapses (see §9).
- **PageQuestion slot:** pinned strip beneath the top bar on major pages — the page's question (label token, tertiary) + current one-line answer (body, primary) + optional action chip. Live-updates; shimmer while computing; hides entirely rather than showing a stale/empty answer.
- **EnergySelector:** 3-segment control Low/Med/High with battery icons, 44px targets, selected segment fills accent; compact top-bar chip form (tap → re-log popover with "why?" one-word field).
- **SeasonChip:** top-bar pill — icon + season name + days-left ("🎯 Exam week · 4d"); tap → popover: switch season (preset grid), edit config, end now (→ retro mini-form). Hidden when season = Normal.
- **FocusOverlay:** full spec in §5.21.

---

## 5. Page Specifications

Format per page: **Layout → Regions → Key interactions → States**. All pages inherit shell, skeleton loading, error boundary (see §7).

### 5.1 `/` Today
Named **Today** in nav and title. Three modes; segmented control (top-right) to override.
- **Morning Briefing — mission control, not widgets.** A single 640px column of **briefing rows**, read top-to-bottom; each row = one sentence + at most one decision; empty rows collapse. Order per PRD §4.2: greeting (display type) → **Sleep row** (duration/quality chip + correct action) → **Energy check-in** (inline EnergySelector; the row stays until answered) → **Today's Mission** (hero row: elevated card, accent left bar, mission line in `title` type + Start button; priorities 2–3 collapsed beneath, expandable) → **Focus Score row** (mono numbers + 24px sparkline) → **Deadline rows** (countdown chips, `Plan it` ghost actions) → **Meetings/classes** (mini timeline rows, next one accent-ringed) → **Workout DecisionCard** → **Weather placeholder row** → **Yesterday's-unfinished DecisionCard** (`Finish 3 · Move 2 · Ignore 4` → opens sweep sheet) → **held-notifications digest row** → **✨ AI recommendation row** (one sentence + action button) → **closer** (memory card / streak fact / quote). Bottom: "Start my day →" (primary, collapses into Day mode). Rows stagger-fade in 40ms apart (reduced-motion: instant). Row anatomy: 20px leading icon in muted circle · content · trailing action; visual weight comes from type, not boxes — hairline separators only.
- **Day mode:** Now card grows (active-block timer ring), Next-up list, progress strip pinned under top bar; up to 2 contextual DecisionCards between Now and Next.
- **Evening mode:** Day review card (checkable summary rows), **Tomorrow Studio** CTA card (accent, "Design tomorrow"), Journal quick card (mood emoji row → opens journal with mood set), wind-down countdown chip.
- **Interactions:** every ring/metric taps to quick-log; pull-to-refresh mobile.
- **PageQuestion:** "What should I do next?" — answered by the Now card / Mission row itself (no separate slot on this page).
- **States:** first-run → onboarding checklist card (create first task/habit/plan); all-done day → "day complete" static graphic; briefing opened after 11:00 → collapsed to Day mode with "review briefing" link.

### 5.2 `/planner`
- **Layout:** left = day timeline (fills height, scrolls, now-line in accent with time bubble); right rail 280px = Unscheduled tray (tasks due/scheduled today without blocks, drag sources) + day stats (planned h, focus h, free h).
- **Top bar:** date controls, "Generate ✨" (or "Regenerate"), "Rescue my day" (appears per FR-PLAN rules, warning tint), kebab (templates, copy day, clear draft).
- **Interactions:** drag/resize per FR-PLAN-2 (ghost preview + snapped time bubble while dragging, spring settle); click block → peek panel (details, start/complete/skip, notes, rationale); double-click empty → new block inline (title input in place, time from position); `B` new block; draft overlay = dashed blocks + sticky accept bar bottom ("AI draft — Accept all · Edit · Discard" + unplaced-tasks disclosure).
- **PageQuestion:** "What's the best use of my remaining time?" — remaining free minutes + top candidate ("2h 10m free — best use: DBMS assignment"); shows a `Rescue` action chip when ≥2 blocks are missed.
- **States:** empty day → EmptyState "Nothing planned — generate or press B"; past day → read-only tint + "retro-log" edit toggle; generation → skeleton blocks pulsing top-down.

### 5.3 `/calendar`
Month: 6-row grid, day cells (date numeral top-right, up to 3 EventChips + "+n more" popover); today = accent numeral ring. Week/Day: hour grid 05–02, events as blocks (area color), tasks-due lane atop as chips, drag-create with live time bubble, drag/resize events. Agenda: grouped list by day. Mini-month popover from title. `M/W/D/A` switch views. Event click → peek (details, reminders editor rows, recurrence badge, delete w/ scope prompt). States: month with zero events → faint dotted "quiet month".

### 5.4 `/tasks`
Toolbar: view tabs (Inbox·Today·Upcoming·All + saved views), filter button (drawer: status/priority/area/project/tag/date pickers → chips row), sort menu, layout toggle (list/board), New task (primary). List: grouped (Today: Overdue → Due → Scheduled; Upcoming: by day). Board: columns by status, drag between = status change (optimistic). Multi-select: click+shift / `x` per row → floating action bar bottom (count + bulk buttons). Peek panel per FR-TASK-8: title (inline edit), description editor, properties grid (2-col: status, priority, due, scheduled, estimate, energy, area, project, tags, recurrence, blocked-by), subtask checklist (+ add row), linked notes, work history (blocks list), activity feed collapsed. States: Inbox zero → "Inbox zero ✨" graphic; filter no-match → "No tasks match — clear filters".

### 5.5 `/projects` & `/projects/[id]`
Gallery: area sections, ProjectCards (title, progress ring, deadline countdown, health chip, current-focus line, blocker line if set, last-touched). PageQuestion: "What's blocking progress?" — aggregates blockers/stalls ("2 projects blocked, 1 stalled — review?" → filtered view). New project modal (name, area, deadline?, goal statement).
Detail: header (title inline-edit, health chip, deadline, progress bar w/ override handle) + **pinned rail directly under the header, visible on every tab** (PRD FR-PROJ-4): three equal slots — **Current Focus** (inline-editable line, staleness dot at 7d) · **Current Blocker** (amber-tinted field when filled, "No blocker 🎉" otherwise) · **Next Milestone** (name + countdown, taps to Milestones). Tabs per PRD §8.1: Overview · Tasks · Milestones · Notes · Resources · **Brain Dump** (full-width borderless editor, "Extract tasks ✨" top-right) · **Scratchpad** (same editor, tertiary "working memory — overwrite freely" caption) · **Ideas & Parking Lot** (two columns of lightweight list rows; idea rows get a `→ Task` promote button; parked rows show revisit date chip). States: no projects → EmptyState with example card ghost.

### 5.6 `/college`
Dashboard grid: Next class card (big countdown, room, course color) · Due soon list (assignments w/ course chips) · Exams countdown cards (days big numeral) · Attendance warnings · Courses grid (cards: code, name, attendance %, avg grade vs target chip). Course page: header + tabs (Assignments · Exams · Sessions · Notes). Assignment row: title, due (relative), effort, status select, grade field after done. Exam page: syllabus checklist with progress bar, revision-plan CTA ✨. Class-schedule editor: week grid painter (click-drag to place session, pick course). Semester switcher in page header.

### 5.7 `/internship`
Header profile card. Today: work-log entry card (bullets editor + hours stepper, "log day" primary at 17:30+ if empty). This week: meetings list, work items (ticket chips). Learnings feed. Weekly summary card ✨ (Mon mornings). Read-only mode when ended: muted banner + stats summary.

### 5.8 `/notes` & `/notes/[id]`
List: search-first header, pinned row, then updated-desc grid/list toggle; NoteCard = title, 2-line excerpt, tags, area dot, updated. Editor page: title (display type, borderless), block editor full-width max 720px centered, right meta rail (collapsible): area/project/tags/backlinks/related ✨. Slash menu `/` for blocks; `[[` link picker; `@` entity mention. Autosave chip ("Saved · 2s ago"). States: empty → "Your first note" CTA + `N` hint.

### 5.9 `/journal` & `/journal/[date]`
Index: PageQuestion "What patterns are emerging?" (deterministic mood-trend line, ✨ weekly-digest sentence when available); streak header chip, mood heatmap (year, GitHub-style, mood colors), entry list (date, mood emoji, first line). Entry: date header + "this day last year" card if exists; sections as soft-labeled groups: mood emoji picker row (48px targets) + feeling-word chips; Wins/Lessons/Gratitude = 3 lightweight bullet editors; Reflection = prose editor with ghost prompt text; bottom "Done for today ✓" (marks complete, streak tick animation). States: today empty at evening → prompt banner.

### 5.10 `/habits`
Today section: habit rows (icon, name, streak chip, control = check circle or stepper+mini-bar; done = row tint success 8%). Week grid: habits × 7 days dot matrix (tap to toggle past days ≤7). Per-habit page (peek): month heatmap, completion stats, config form. New habit modal: name/icon/color/type/target/schedule/reminder. States: all done → confetti-free "All habits done" banner (satisfying check cascade animation on last one, 400ms staggered).

### 5.11 `/health` (tabs)
- **Overview:** PageQuestion "Which one habit should I improve today?" (lowest 7-day-completion habit, rendered as a DecisionCard with a concrete step) → 4 rings (water, kcal, protein, sleep vs target) + weight sparkline + this-week workouts chips + quick-log buttons row (＋Water ＋Meal ＋Weight ＋Sleep ＋Workout).
- **Workouts:** Start-workout card (template picker) · live session view = exercise list, set rows (prev values ghosted, weight/reps steppers, ✓ per set), rest timer bar (full-width countdown, skippable), finish summary modal (volume, PRs w/ 🏆 pulse) · history list → session detail · per-exercise progress page (1RM/volume charts, PR table).
- **Nutrition:** day view meal groups (B/L/D/S) with + row each; food picker sheet (recents grid, favorites, search, "new food" inline form); day macro bars vs targets; week chart.
- **Sleep:** log card (dual-thumb time range slider over a 20:00–12:00 arc, quality stars), duration vs target bars (14d), consistency scatter, debt chip.
- **Weight:** big current (7-day avg, display type) + delta chip, chart w/ goal line, log FAB, entries list (edit/delete).
- **Water:** giant ring + glass buttons (+250/+500/custom), today log list, week bars.

### 5.12 `/finance` (tabs)
- **Overview:** PageQuestion "Where am I overspending this month?" (most over-pace category + decision: "Food is 40% over pace — freeze eating out?") → month switcher; donut by category (center = total spent); budget bars list (category, spent/budget, pace tick mark, >80% amber, >100% red); income/expense summary; subscriptions total card; savings goals mini-bars.
- **Transactions:** toolbar (month, account/category/type filters, search, export CSV, ＋ primary); virtualized table (date · merchant/note · category chip · account · amount mono, expenses default color / income success); row click → peek edit; inline add row atop (amount → category → note, Tab-flow, Enter saves and refocuses amount — rapid-entry optimized).
- **Budgets:** editable amount per category (inline mono inputs), copy-last-month button, overall cap row.
- **Subscriptions:** cards (logo-letter avatar, name, ₹/cycle, next renewal countdown, active toggle), monthly-equivalent header stat, renewal history per card.
- **Goals:** SavingsGoalCards (progress bar, target date projection line, ＋Contribute button → amount modal).

### 5.13 `/goals`
Grid of GoalCards (title, why line clamp-1, progress visual per metric type, area dot, target date, status chip, "last check-in n d ago"). Detail peek: progress editor per type, linked entities chips, check-in composer (note + progress), check-in timeline. Achieved → card gets success glow + moves to Achieved section (year-grouped). New goal modal = 2-step (what/why → how measured w/ metric type picker cards).

### 5.14 Wizards — Tomorrow Studio, `/plan/week`, `/review/month`
All are full-screen focused wizards (shell chrome hidden except exit ✕): step indicator top (n dots), one step per screen, large type, Continue primary bottom-right, back ghost.
- **Tomorrow Studio** (entered from Evening mode / 21:30 nudge): the same wizard shell in a **night treatment** — base deepened to `#060608`, motion slowed to `dur-slow` throughout, larger type. Step 2 sweep = triage list with per-row `Finish tmrw · Backlog · Drop` segmented buttons (+ Inbox-sweep rows when inbox >10); step 3 = priority picker (slot #1 labeled **Tomorrow's Mission**) then draft-plan preview (mini timeline); final screen "Accept & wind down" (primary) → journal shortcut → sleep countdown.
- **Weekly plan:** step 1 stats = Analytics StatCard row (§5.23 components) + ✨narrative paragraph; step 3 priorities = 5 slot rows with entity linker.
- **Monthly review:** scrolling report (sections per PRD 18.2, print-friendly) with reflection inputs inline and ✨proposals as ProposalCards at end; "Complete review" seals it (inputs become read-only, sealed banner with date).

### 5.15 `/timeline`
Should feel like GitHub's contribution graph × Apple Photos memories × Google Timeline — a place you'll love scrolling in three years.
- **Header:** PageQuestion "What have I accomplished recently?" (last-30-days highlights strip: up to 5 event chips) + **activity fabric** — GitHub-style per-day contribution heatmap for the selected year (intensity from activity_log; hover = day summary popover; click = jump to that month).
- **Memories row:** "On this day" card(s) — 1 month / 1 year ago; photo-forward when a photo exists (full-bleed image card with overlay title), otherwise icon card.
- **Spine:** vertical center spine, alternating cards desktop / left-aligned mobile; month markers sticky; **season bands** render as labeled tinted background spans along the spine ("Exam week", "Goa trip"); year lens = zoomed-out row of month capsules w/ counts (click to jump); event card = icon in colored ring, title, date, description, source chip (auto/manual), kind color per area, photo thumb when present.
- Filters top (kind, area, year). ＋ Add memory (modal: date/title/desc/icon/photo). States: sparse → "Your story starts here" + add-first-memory.

### 5.16 `/assistant` & AI drawer
Chat column max 720px: messages per §4.5, tool chips, ProposalCards inline, citation chips (entity pills → peek on click). Composer: multiline input (Enter send, Shift+Enter newline), stop square while streaming, suggestion chips above when empty ("What's overdue?" · "Plan my afternoon" · "How did I sleep this week?"). Left rail (page only): conversation list + New chat. Drawer variant: same minus rail, header shows context page name. Budget-cap state: amber banner with spend meter; hard-cap → composer disabled with explanation.

### 5.17 `/automations`
List: rule rows (⚡icon, name, trigger summary sentence, enabled toggle, last-run status dot, run-count). Built-ins section labeled "Built-in" (editable, restore-default option). Editor (full modal 720): three stacked sections — **When** (trigger picker cards → config fields), **If** (condition rows, ＋ add, AND label between), **Then** (action rows with template fields; notification action shows live preview bubble). Footer: Test run (ghost, shows dry-run result inline), Save. Run history drawer per rule (20 rows: time, outcome, output). States: rule error → row danger tint + "needs attention" chip.

### 5.18 `/notifications`
Feed grouped by day; row = type icon (colored), title, body clamp-2, time, unread dot, kebab (mark read, "why?" → popover naming source rule/entity, go to source). Header: filter chips by type, Mark-all-read. States: empty → "All caught up".

### 5.19 `/settings/*`
Two-pane: section nav left (within content area), form panes right; each control = label + description (micro, tertiary) + control right-aligned; groups in cards. Notification matrix = table (types × in-app/push/sound checkboxes). Devices list rows w/ revoke. Seasons pane: active-season card + preset grid + config accordions (M19 contents inline) + history list with retro notes. Data pane: export card (button + last exports list), import card (drop zone + mapping stepper modal), backup status card (last ✓, size, next, history table, "back up now"), trash table (restore/delete-forever). Danger zone card (red border): erase all data (type-to-confirm).

### 5.20 `/login` & first-run
Centered card 360px on base bg with faint radial accent glow: logo mark, email (prefilled), password, remember toggle, sign in primary full-width; error shake 3×4px 240ms + danger message. Forgot → recovery-key flow (key input → new password). First-run wizard: 4 steps (welcome/create account/preferences: TZ·day bounds·units/done: shortcuts primer showing ⌘K ⌘J C F).

### 5.21 Focus Mode (overlay)
Entered via `F`, any Start action, or a block's context menu. **Full-viewport takeover**: all chrome hidden (sidebar, top bar, tabs), base deepened to `#060608`, z-top; enter = 300ms fade + content scale 0.98→1; exit reverses (`Esc` or ✕ top-right).
Centered 560px column: task title (display type; editable "What are you focusing on?" when unbound) → **timer ring** (160px, remaining time in mono 28px; count-up variant ringless) → subtask checklist (list rows, check animations) → notes strip (single borderless input, autosaves to the session) → bottom control bar: pause/resume · +10m · "I got interrupted" (ghost; increments count, one-word reason popover) · music icon button (opens configured URL in new tab) · complete ✓ (primary).
DND badge bottom-left ("holding 3 notifications"). Timer end → soft chime (if sound on) + ring pulses success + `Done / +10m` choice (never auto-exits). Mobile: fullscreen + wake-lock, controls bottom-fixed. Reduced motion: no pulse, static states.

### 5.22 `/inbox` — Life Inbox
Header: unprocessed count ("14 unprocessed"), kind filter chips (text/link/image/audio), "Sort my inbox ✨". Top composer: text field + attach + record buttons (recording = red pulse dot + live waveform bar + 5:00 cap). Card list (masonry on desktop, single column mobile): text cards, link cards (favicon + fetched title), image thumbs (lightbox on tap), audio rows (play button + duration + scrubber). Card actions (hover / long-press): **Organize** (menu: → Task · Note · Event · Expense · Project idea · Memory — opens the target's create-modal prefilled), Archive, Delete. On convert: card animates out + toast "became a Task ↗". Multi-select → bulk archive/convert. States: zero → "Inbox Zero ✨" graphic; stale (>30d) cards tinted tertiary with "still needed?" caption; offline → capture disabled with banner (no write queue in V1).

### 5.23 `/analytics`
Period tabs (Week / 30d / All). Headline StatCard row per PRD §18A: Deep work · Interruptions · Most productive window · Planner accuracy · AI acceptance · Estimate accuracy — each with delta chip and ⓘ formula tooltip. Below, 2-col grid: hour×weekday productivity heatmap (accent 5-step scale) | deep-work trend line w/ target band | interruption-reasons bar | energy overlay (energy dots over deep-work bars). All cards are shared components reused in weekly/monthly reviews. States: per-card minimum-data lock ("Log 5 focus sessions to unlock"); no data at all → EmptyState pointing at Focus Mode (`F`).

---

## 6. Modal & Dialog Inventory (complete)

| ID | Modal | Size | Contents |
|---|---|---|---|
| M1 | Quick Capture | 560 | tab row (Inbox default, auto-switches on task syntax), smart input, parsed chips, per-tab mini-forms |
| M2 | New/Edit Event | 480 | title, date/time range, all-day toggle, recurrence select, reminders list, location, area, notes |
| M3 | Recurrence scope | 360 | this / this+future / all radio + consequence text |
| M4 | New Project | 480 | name, area, goal statement, deadline |
| M5 | New Habit | 480 | per §5.10 |
| M6 | New Goal | 560 | 2-step per §5.13 |
| M7 | Automation editor | 720 | per §5.17 |
| M8 | Confirm destructive | 400 | consequence counts, danger primary |
| M9 | Plan accept bar | sticky bar | not modal — bottom sticky on planner draft |
| M10 | Workout finish | 480 | summary stats, PR list, notes |
| M11 | Contribution (savings) | 360 | amount, date, note |
| M12 | Import mapping | 720 | file info, column-map table, dry-run diff, commit |
| M13 | Shortcut help (⌘/) | 640 | two-column shortcut list by category |
| M14 | Re-auth | 400 | password only, preserves background state |
| M15 | Snooze picker | popover | 10m/1h/tonight/tomorrow/custom |
| M16 | Add memory (timeline) | 480 | date, title, description, icon picker |
| M17 | Export | 480 | scope checkboxes, format, start job |
| M18 | Restore | 560 | snapshot list, consequences, type-to-confirm |
| M19 | Season switcher/editor | 480 | preset cards, config accordions (area weights, planner overrides, notification profile, pausable habits), end date, end-retro mini-form |

## 7. Global States

- **Loading:** route-level skeletons mirror final layout; stale-while-revalidate — show cached data instantly, subtle refresh shimmer in top bar.
- **Errors:** component-level error boundary card ("Something broke here — Retry"); route-level full EmptyState variant; network mutation failure → toast + affected control reverts (optimistic rollback); form errors inline.
- **Offline:** top banner (tertiary) "Offline — viewing cached data"; all mutation controls disabled with tooltip; auto-dismiss on reconnect + "Back online" toast.
- **Empty:** every list/page has a designed EmptyState (§4.3) — copy defined in each page spec above.
- **Sync:** sidebar bottom dot: green ok / amber reconnecting / gray offline.

## 8. Keyboard Map (desktop)

| Key | Action |
|---|---|
| `⌘K` | Command Center (search + commands) |
| `⌘J` | AI assistant drawer |
| `C` | Quick capture |
| `⌘/` | Shortcut help |
| `⌘\` | Toggle sidebar |
| `G` then `H/I/P/C/T/N/J/B/L/F/G/A/Y` | Go to Today(H)/Inbox/Planner/Calendar/Tasks/Notes/Journal/haBits/heaLth/Finance/Goals/Automations/analYtics |
| `F` | Enter / exit Focus Mode |
| `T` | Jump to today (time-based pages) |
| `[` `]` | Previous / next day·week·month |
| `↑↓` / `J K` | Move selection in lists |
| `X` | Toggle select row |
| `Enter` | Open selected (peek) |
| `E` | New event (calendar) · edit selected elsewhere |
| `B` | New block (planner) |
| `N` | New note (notes) |
| `1–4` | Set priority P0–P3 on selected task |
| `D` | Set due date (opens picker on selected) |
| `⌫` | Delete selected (with confirm rules) |
| `Space` | Complete selected task / start-stop block |
| `S` | Snooze selected |
| `Esc` | Close peek/modal/palette, clear selection |
| `⌘Enter` | Save & close any form |
| `⌘Z` | Undo last action (where undoable) |

All shortcuts inactive while typing in inputs (except ⌘-combos). Shortcut hints appear in tooltips, menus, and ⌘/ overlay.

## 9. Micro-interaction & Animation Spec

| Moment | Spec |
|---|---|
| Task complete | checkbox stroke draw 160ms → row fades to 60% + slides 4px right → after 400ms collapses out (dur-base); count badges tick down with 200ms number roll |
| Block start | left bar pulses (1.6s loop, subtle), timer ring sweeps |
| Habit done | ring sweep + 1.05 scale bounce (spring) |
| PR / goal achieved | card glow pulse (accent→success, 600ms ×2) + 🏆 badge pop; no confetti particles (reduced-motion parity) |
| Streak milestone (7/30/100) | toast with flame + count roll |
| Plan accepted | dashed→solid morph per block, staggered 30ms top-down |
| Drag | item lifts (scale 1.02, e2 shadow), drop springs to slot, others reflow 200ms |
| Peek open | slide-in 480px dur-base ease-out; content fades 80ms after |
| Focus Mode enter/exit | chrome fades out, content column scales 0.98→1 over 300ms; exit reverses; timer ring sweeps continuously |
| Briefing load | rows stagger-fade in 40ms apart top-down (≤13 rows); reduced-motion: instant |
| DecisionCard resolved | chosen button fills its color, card collapses with 200ms height ease + ✓ tick |
| Page nav | content crossfade 150ms + 8px rise; sidebar active bar slides between items |
| Toast | rise+fade in, drop+fade out |
| Number changes (stats) | rolling digits 200ms |
| Now-line (planner) | repositions each minute with 1s ease |

## 10. Accessibility Checklist (enforced in review)

- Tab order follows visual order; focus ring never suppressed; skip-to-content link.
- All icon buttons `aria-label`; charts get `role=img` + text summary; rings expose value/max.
- Live regions: toasts `polite`, timer announcements suppressed, streak/PR announcements `polite`.
- Modals: focus trap, return focus on close, `aria-modal`.
- Color never sole signal (overdue = color + icon + text).
- Text scales to 125% browser zoom without breakage; hit targets ≥44px touch.
- Full app usable with screen reader for core loops (capture, complete, log, read plan) — tested per release.
