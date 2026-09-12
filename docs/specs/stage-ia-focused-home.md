# Stage — Navigation IA: Focused Home + Pinned Sidebar (Charter)

> **Status:** in progress (2026-09-12) · branch `stage-ia/focused-home` (based on `stage-auth/google-signin`)
> **Why:** with ~37 surfaces the app felt overwhelming to operate. The owner chose a **calm Home** as the
> landing plus a **pinned favorites row** in the (already grouped) sidebar.

## What was built
- **Calm Home** (`/home`, `components/home/FocusedHome.tsx`) — the new default landing. Greeting + the
  single "right now" recommendation (reuses Command Center's `NextActionHero`/`chief.now`), one-tap
  **Capture** + **Jump to anything** (⌘K palette), and a small fixed grid of daily surfaces (Today,
  Tasks, Calendar, Inbox, Journal, Chief). Command Center stays as the full "at a glance" board.
- **Landing repointed**: `app/page.tsx` → `/home` (was `/command-center`); Home added as the first
  Primary nav item.
- **Sidebar cleanup** (`components/shell/sidebar-content.tsx`): a per-viewer **Pinned** row at the top
  (localStorage via `lib/shell/use-pins.ts`), rows reveal a pin/unpin control on hover, and only
  **Primary** is open by default now (Work/Life/Intelligence/System start collapsed, one click away).
- **Bug fix** (caught by preview): the auth sign-in card rendered its heading + subtitle on one line
  because `Text` defaults to an inline `<span>` — switched to block elements (`auth-widgets.tsx`). This
  also affected the live deployed sign-in page.

## Not changed
Grouping already existed (collapsible sections, active-section auto-open, remembered state) — this pass
adds the Home + pins on top of it rather than re-architecting the nav.

## Gates
typecheck ✓ · lint 0/0 ✓ · nav test (37 routes) ✓ · repository-audit 8/8 · next build (`/home` compiles).
Sign-in verified visually in the preview; `/home` is build/type-verified (gated behind Google auth locally).
