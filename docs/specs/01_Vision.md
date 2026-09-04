# 01 — Vision

**Project:** My OS — "The Operating System for My Life."
**Document status:** Final for Version 1
**Audience:** The single user/owner, and any engineer (human or AI) implementing the system.

---

## 1. Vision

One application that runs my life the way an operating system runs a computer: it schedules, it prioritizes, it remembers, it interrupts me only when it should, and it always knows what process deserves the CPU — my attention — right now.

Every time I open My OS, it must answer one question better than anything else in the world:

> **"What should I be doing right now?"**

Every screen, every feature, every background job exists to make that answer more accurate, more timely, and more trustworthy.

## 2. Mission

Replace the ten disconnected apps I use today — calendar, todo list, notes, journal, habit tracker, fitness logger, water reminder, sleep tracker, budget spreadsheet, and reminder app — with a single, private, AI-augmented system that:

1. **Collects** everything about my commitments, health, money, projects, and reflections in one place.
2. **Connects** that data so context is never lost (a task knows its project; a project knows its deadline; the planner knows my energy after a bad night's sleep).
3. **Computes** a daily plan, priorities, reminders, and reviews from that connected data.
4. **Confirms** with me before anything important changes — AI proposes, I decide.

## 3. Goals

### Product goals (Version 1)

| # | Goal | Success signal |
|---|------|----------------|
| G1 | The Today screen opens as a **briefing** that answers "what now?" within 2 seconds | I stop opening other apps to decide what to do |
| G2 | A full day plan can be generated, reviewed, and accepted in under 60 seconds | I plan every day, not just motivated days |
| G3 | All reminders (tasks, water, sleep, meetings, deadlines) come from one system | Phone/desktop notifications from other apps are turned off |
| G4 | Logging anything (water, weight, expense, journal, task) takes ≤ 3 interactions | Daily logging streaks survive busy weeks |
| G5 | The AI assistant can answer any question about my own data | "When did I last work on X?" gets a correct, cited answer |
| G6 | Nothing is ever lost | Nightly backups verified; full export at any time |

### Personal goals it serves

- Graduate college with strong grades while performing well at my internship.
- Build consistent health habits: workouts, water, sleep, weight awareness, nutrition awareness.
- Keep personal projects moving instead of stalling for weeks.
- Understand where my money goes and grow savings.
- Build a written record of my life (journal + life timeline) I'll value in ten years.

### Engineering goals

- Production-quality architecture, boring proven technology, one-command deployment.
- Optimized for exactly one user: no multi-tenancy complexity, but clean enough that it could scale later.
- Every feature independently buildable and testable (see `07_Implementation_Roadmap.md`).
- The system must run unattended: scheduled jobs, notifications, and backups work without babysitting.

## 4. Philosophy

### Product philosophy

1. **One question first.** Every design decision is judged by whether it improves the answer to "what should I be doing right now?" Features that don't feed that answer are secondary surfaces.
2. **Decisions, not dashboards.** Information is the input; a decision is the product. Every count, stat, or alert arrives with its next action attached — not "8 overdue tasks" but "Finish 3 · Ignore 5"; not "workout missed" but "Workout now? 45 min available." Every major page answers one question: Today → *what should I do next?* · Planner → *best use of my remaining time?* · Projects → *what's blocking progress?* · Health → *which one habit today?* · Finance → *where am I overspending?* · Journal → *what patterns are emerging?* · Timeline → *what have I accomplished?*
3. **Capture is sacred.** If capturing a thought, task, or metric is slower than a sticky note, the system fails. Quick-capture is always one shortcut away, from anywhere — and anything that has no home yet lands in the Life Inbox to be organized later.
4. **The plan is a draft, life is the editor.** Days go sideways. Replanning must be cheaper than abandoning the plan.
5. **Data compounds.** A water log is trivial; a year of water, sleep, mood, and workout logs is self-knowledge. Log everything cheaply, visualize everything beautifully.
6. **Calm technology.** Notifications are a scarce resource spent carefully. Quiet hours are respected absolutely. Silent reminders exist for a reason. Focus Mode makes the whole system go quiet on command.
7. **Beautiful is functional.** Density, typography, and speed (Linear/Arc/Raycast lineage) are not decoration — they are what makes a daily-driver tool livable.

### AI philosophy

The AI is a **chief of staff, not an autopilot**.

- It **organizes** (files, links, tags, groups).
- It **prioritizes** (scores and orders what matters).
- It **recommends** (plans, schedules, focus blocks, habit adjustments).
- It **optimizes** (reflows the day when things slip).
- It **summarizes** (days, weeks, months, projects).
- It **assists** (answers questions over my data with citations).
- It **predicts** (deadline risk, habit slippage, budget overrun).
- It **adapts** (to my declared **season of life** — exam week, internship crunch, gym cut, travel — reweighting priorities, plans, and reminders without reconfiguration).
- It **never silently mutates important data.** Every AI-originated change to tasks, events, plans, finances, or health records is a *proposal* that I explicitly accept, edit, or reject. Trivial derived data (summaries, embeddings, scores) may be written automatically.

### Privacy philosophy

- Single user. Self-hosted. My data lives in my database on infrastructure I control.
- The only data that leaves the system goes to the Anthropic API (AI) and Voyage AI (embeddings), both scoped to the minimum context needed per request. A "local-only mode" toggle disables all external AI calls and degrades gracefully.
- No analytics, no telemetry, no third-party trackers.

## 5. Non-Goals (Version 1)

Explicitly out of scope. Many appear in `09_Future_Versions.md`.

- **Not a SaaS.** No sign-up flow, no multi-user, no teams, no sharing, no billing.
- **No public release, no app-store distribution.** PWA install only.
- **No native mobile apps.** The PWA is the mobile experience.
- **No third-party integrations in V1**: no Google Calendar sync, no bank sync (Plaid), no wearable sync (Apple Health/Fitbit), no email ingestion. All data is entered in-app. (Import via CSV/JSON is supported.)
- **No real-time collaboration/multiplayer machinery** (CRDTs, presence, etc.).
- **No offline-first write support.** The PWA caches for fast loads and read access; writes require connectivity. (Offline queue is a future version.)
- **No voice interface.**
- **No end-to-end encryption.** At-rest disk encryption + TLS + single-user auth is the V1 security model.
- **The AI never sends messages, spends money, or contacts anyone.** It has no outbound effectors besides notifications to me.

## 6. Product Identity

| Attribute | Definition |
|---|---|
| **Name** | My OS |
| **Tagline** | The Operating System for My Life |
| **Codename / package scope** | `myos` (repos, packages, DB name) |
| **Personality** | A calm, precise chief of staff. Confident, brief, decision-oriented, never chirpy. Says "3 things need you today" and "Workout now? You have 45 free minutes" — not "You've got this!! 🎉" |
| **Voice & tone** | Second person, present tense, concrete: "Physics assignment due in 26 hours. 2h estimated, nothing scheduled yet." Motivation is earned data ("14-day journal streak"), not stock quotes — though an optional daily quote closer exists in the Morning Briefing. |
| **Visual identity** | Dark-first, near-black surfaces, one restrained indigo accent, Inter for UI, JetBrains Mono for numbers. High density, generous alignment, subtle motion. Full spec in `03_Design_Requirements_Document.md`. |
| **The mark** | A minimal terminal-style prompt glyph `▮` in accent color inside a rounded square — "the cursor of my life, waiting for the next command." Used as favicon, PWA icon, and empty-state motif. |
| **North-star interaction** | Open app → the Morning Briefing reads like mission control → the mission line says exactly what to do → do it. Zero taps. |

## 7. Guiding Constraints

1. **Speed budget:** first contentful paint < 1s on desktop, < 2.5s on mobile PWA; every interaction < 100ms perceived.
2. **Keyboard-first on desktop:** every core action reachable without a mouse; ⌘K is the front door.
3. **Data model before UI:** every feature is designed schema-first (`05_Database_Design.md` is the source of truth for shape).
4. **AI is optional infrastructure:** the app must be fully usable — planning, logging, reminders — with AI disabled. AI multiplies value; it must never be a single point of failure.
5. **Boring technology, deliberate exceptions:** proven mainstream stack (TypeScript, Next.js, Postgres). The only "exotic" dependencies are pgvector and the AI SDKs, both isolated behind interfaces.

## 8. Document Map

| Doc | Contents |
|---|---|
| `01_Vision.md` | This document — why and what |
| `02_Product_Requirements_Document.md` | Every feature, workflow, interaction, edge case |
| `03_Design_Requirements_Document.md` | Design system, every page/component/modal/state/animation |
| `04_System_Architecture.md` | Frontend, backend, workers, scheduling, notifications, auth, storage, deployment |
| `05_Database_Design.md` | Complete relational schema, relationships, indexes, data flow, backups |
| `06_AI_Architecture.md` | Planner, context engine, prioritizer, reminders, memory, prompts |
| `07_Implementation_Roadmap.md` | Staged build plan; each stage independently buildable and testable |
| `08_Developer_Guidelines.md` | Folder structure, naming, standards, git, testing, docs |
| `09_Future_Versions.md` | Deliberately excluded ideas for V2+ |
