"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button, Card, Kbd, MonoLabel, Text } from "@myos/ui";
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
 * The calm Home — the default landing (V2 IA pass). Deliberately sparse: a greeting, the single
 * "right now" recommendation (shared with Command Center), one-tap capture + jump-to-anything, and a
 * small grid of the daily-driver surfaces. Everything else stays one click away in the grouped sidebar;
 * Command Center remains the full "whole life at a glance" board for when you want the density.
 */
const DAILY_SURFACES = ["/today", "/tasks", "/calendar", "/inbox", "/journal", "/chief"] as const;

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export function FocusedHome() {
  const now = trpc.chief.now.useQuery(undefined, { refetchInterval: 120_000 });
  const setCommandOpen = useShellStore((s) => s.setCommandOpen);
  const setQuickAddOpen = useShellStore((s) => s.setQuickAddOpen);
  const { identity } = useIdentity();
  const firstName = identity?.preferences.displayName?.trim().split(/\s+/)[0] ?? null;

  return (
    <PageContainer width="content">
      <PageContent className="mx-auto w-full max-w-3xl space-y-6 py-2">
        <header className="space-y-1">
          <MonoLabel tone="subtle">Home</MonoLabel>
          <Text asChild variant="heading-l" className="text-balance tracking-tight">
            <h1>
              {greeting()}
              {firstName ? `, ${firstName}` : ""}.
            </h1>
          </Text>
        </header>

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
            className="border-border bg-elevated hover:bg-overlay focus-visible:ring-ring group flex flex-1 items-center justify-between gap-2 rounded-lg border px-3 py-2 outline-none transition-colors focus-visible:ring-2"
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

        {/* Daily surfaces — a small, fixed set. Everything else is in the sidebar. */}
        <section className="space-y-2">
          <MonoLabel tone="subtle">Jump back in</MonoLabel>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DAILY_SURFACES.map((href) => {
              const item = getNavItem(href);
              const Icon = item.icon;
              return (
                <Card key={href} variant="interactive" padding="none">
                  <Link href={href} className="flex h-full flex-col gap-1.5 p-3.5">
                    <Icon size={18} aria-hidden className="text-accent" />
                    <Text variant="body-s" className="font-medium">
                      {item.label}
                    </Text>
                    <Text variant="caption" tone="subtle" className="line-clamp-2">
                      {item.description}
                    </Text>
                  </Link>
                </Card>
              );
            })}
          </div>
        </section>
      </PageContent>
    </PageContainer>
  );
}
