# @myos/ui

**The design system** — the themeable, accessible React component library and design tokens every app surface is built from.

## Purpose

One consistent, light/dark-aware visual language. Feature code composes these primitives instead of hand-rolling markup, so spacing, color, typography, and interaction stay uniform across the whole OS.

## Architecture

```
src/
  components/   Button, Card, Text, Badge, Tabs, Dialog, Input, Switch, … (Radix-backed where interactive)
  hooks/        use-theme, …
  lib/cn.ts     class merge helper
  index.ts      public barrel
```

Colors are CSS variables (`bg-base`, `bg-elevated`, `text-fg`, `text-fg-muted`, `border-border`, …) — use tokens, never raw hex. Note: `bg-canvas` is **not** a token; use `bg-base`.

## Dependencies

- `react`, `@radix-ui/*`, `lucide-react`, `tailwind`. No business logic, no `@myos/core`/`@myos/ai`.

## Public API

```ts
import { Button, Card, Text, Badge, Tabs, TabsList, TabsTrigger } from "@myos/ui";
```

Everything is exported from the root barrel; there are no deep imports.

## Extending

Add a component under `src/components/`, export it from `src/index.ts`, and theme it for both color schemes. Prefer Radix primitives for anything interactive (menus, dialogs, tabs). ⚠️ Radix `Tabs` detaches inactive panels — drive tab state via controlled JS rather than relying on stale refs. Buttons have `primary`/`secondary`/`ghost` variants (no `accent`).
