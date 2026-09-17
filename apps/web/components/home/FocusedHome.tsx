"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button, Kbd, MonoLabel, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { useShellStore } from "@/lib/shell/store";
import { useIdentity } from "@/lib/identity";
import { getNavItem } from "@/lib/shell/nav";
import {
  NextActionHero,
  NextActionHeroSkeleton,
} from "@/components/command-center/command-center-panels";
import { PageContainer, PageContent } from "@/components/framework";

/**
 * The calm Home — the default landing (V2 IA pass; V2 aesthetic pass). A time-aware greeting over an
 * ambient amber aurora, a real day-at-a-glance strip, the single "right now" recommendation (shared with
 * Command Center), one-tap capture + jump-to-anything, and a small grid of the daily-driver surfaces
 * with hover-lift. Everything else stays one click away in the grouped sidebar; Command Center remains
 * the full "whole life at a glance" board for when you want the density.
 */
const DAILY_SURFACES = ["/today", "/tasks", "/calendar", "/inbox", "/journal", "/chief"] as const;

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function todayLabel(now = new Date()): string {
  return now
    .toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })
    .toUpperCase();
}

export function FocusedHome() {
  const now = trpc.chief.now.useQuery(undefined, { refetchInterval: 120_000 });
  const counts = trpc.task.counts.useQuery();
  const setCommandOpen = useShellStore((s) => s.setCommandOpen);
  const setQuickAddOpen = useShellStore((s) => s.setQuickAddOpen);
  const { identity } = useIdentity();
  const firstName = identity?.preferences.displayName?.trim().split(/\s+/)[0] ?? null;

  const open = counts.data?.open ?? 0;
  const overdue = counts.data?.overdue ?? 0;
  const scheduled = counts.data?.scheduled ?? 0;

  return (
    <PageContainer width="content" className="relative overflow-hidden">
      {/* Ambient light — the amber accent as a real source. */}
      <div className="myos-aurora" aria-hidden />
      <div className="myos-grid-tex" aria-hidden />

      <PageContent className="myos-stagger relative z-[1] mx-auto w-full max-w-3xl space-y-6 py-2">
        <header className="space-y-2">
          <MonoLabel tone="subtle" bead>
            Home · {todayLabel()}
          </MonoLabel>
          <Text asChild variant="display-m" className="text-balance tracking-tight">
            <h1>
              {greeting()}
              {firstName ? (
                <>
                  , <span className="text-accent-fg">{firstName}</span>
                </>
              ) : null}
              .
            </h1>
          </Text>
        </header>

        {/* Day at a glance — real counts, state encoded in form. */}
        <div className="flex flex-wrap gap-2">
          <GlanceChip tone="ok" label="Tasks" value={`${open} open`} />
          {overdue > 0 ? <GlanceChip tone="warn" label="Overdue" value={String(overdue)} /> : null}
          <GlanceChip tone="info" label="Scheduled" value={String(scheduled)} />
        </div>

        {/* Right now — the single next action, shared with Command Center. */}
        {now.isLoading ? (
          <NextActionHeroSkeleton />
        ) : now.data ? (
          <NextActionHero data={now.data} />
        ) : null}

        {/* Capture + jump-to-anything. */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="sm:w-auto"
            leftIcon={<Plus size={15} aria-hidden />}
            onClick={() => setQuickAddOpen(true)}
          >
            Capture
          </Button>
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="border-border bg-elevated hover:border-border-strong hover:bg-overlay focus-visible:ring-ring group flex flex-1 items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 outline-none transition-colors focus-visible:ring-2"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Search size={15} aria-hidden className="text-fg-subtle group-hover:text-fg-muted" />
              <Text variant="body-s" tone="muted">
                Jump to anything…
              </Text>
            </span>
            <span className="flex shrink-0 items-center gap-0.5">
              <Kbd size="sm">⌘</Kbd>
              <Kbd size="sm">K</Kbd>
            </span>
          </button>
        </div>

        {/* Daily surfaces — a small, fixed set with hover-lift. */}
        <section className="space-y-2.5">
          <MonoLabel tone="subtle">Jump back in</MonoLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {DAILY_SURFACES.map((href) => {
              const item = getNavItem(href);
              const Icon = item.icon;
              return (
                <Link
                  key={href}
                  href={href}
                  className="myos-lift border-border bg-surface shadow-e1 group relative flex h-full flex-col gap-1.5 overflow-hidden rounded-2xl border p-4"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    style={{
                      background: "radial-gradient(closest-side, var(--accent-muted), transparent)",
                    }}
                  />
                  <span className="bg-accent-muted border-accent-border text-accent-fg mb-1 flex size-9 items-center justify-center rounded-xl border">
                    <Icon size={18} aria-hidden />
                  </span>
                  <Text variant="body-s" className="font-semibold">
                    {item.label}
                  </Text>
                  <Text variant="caption" tone="subtle" className="line-clamp-2">
                    {item.description}
                  </Text>
                </Link>
              );
            })}
          </div>
        </section>
      </PageContent>
    </PageContainer>
  );
}

function GlanceChip({
  tone,
  label,
  value,
}: {
  tone: "ok" | "info" | "warn";
  label: string;
  value: string;
}) {
  const dot = tone === "ok" ? "bg-success" : tone === "warn" ? "bg-warning" : "bg-info";
  return (
    <span className="border-border bg-surface shadow-e1 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5">
      <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
      <MonoLabel tone="subtle">{label}</MonoLabel>
      <Text variant="body-s" className="font-medium tabular-nums">
        {value}
      </Text>
    </span>
  );
}
