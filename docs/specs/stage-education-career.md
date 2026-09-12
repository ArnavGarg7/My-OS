# Stage — Education & Career Module (Charter)

> **Status:** in progress (2026-09-12) · branch `stage-edu/education-career` (from `main`)
> **Why:** the owner wants College + Internship to be real (the `/college` + `/internship` routes are
> placeholder stubs today), with the class **timetable driving Today**, plus **advance-dated targets**.

## Scope
- **College:** courses, a weekly **timetable** (recurring class sessions), **assignments** (deadlines →
  tasks/Today), and **exams**.
- **Internship:** a **work log** (hours/attendance), meetings, learnings, deliverables.
- **Advance-dated targets:** set a goal for a specific future date; it **surfaces in Today** when the
  date approaches. General (not college-only), date-anchored, lighter than the Goals engine.
- **Today integration:** class sessions appear as **fixed blocks**; due assignments/exams and active
  targets surface for the day.

## Build order (parts)
- **A — Data model + pure core** (this increment): `schema/education.ts` (courses, class_sessions,
  assignments, exams, internship_entries, targets), classification entry, migration, and
  `@myos/core/education` (schedule expansion for a date, upcoming deadlines, target surfacing) — pure,
  tested, no IO.
- **B — Server:** repo/service/router (CRUD + day/week queries), tRPC.
- **C — UI:** fill the College stub (timetable grid + assignments/exams) and Internship stub (log +
  deliverables); a targets surface. Slot into the grouped nav (already under "Work").
- **D — Timetable ingestion (done, image/vision):** manual grid entry (always reliable) **plus import
  from a photo**. Rather than retrofit the frozen, text-only AI gateway, a **feature-local vision
  extractor** (`server/education/timetable-vision.ts`) sends the image to Gemini `generateContent` with
  an inline-image part, asks for JSON, and validates it with the pure `validateStructured` helper. The
  browser downscales the photo first; the parsed classes are shown for **review** before `importTimetable`
  commits them (dedupes courses by title). Model overridable via `MYOS_VISION_MODEL`; needs `GEMINI_API_KEY`.
  `.docx`/PDF-file upload remains a later add (needs a doc-parsing dependency).
- **E — Today integration:** class blocks into the planner/today; advance-dated targets surface on date.

## Conventions
Pure `@myos/core/education` → `apps/web/server/education` (repo/service/router, `server-only`) →
`components/education` UI. Free-text bodies (assignment details, exam/internship notes) use the Stage C
`encryptedText` column (encrypted at rest, no migration). Single-user (no user_id).

## Gates
typecheck · lint 0/0 · core tests · migration forward-only · security-audit (classification) · repo-audit 8/8 · build.
