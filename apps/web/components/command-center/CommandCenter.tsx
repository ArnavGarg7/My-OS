"use client";

import { useEffect, useMemo, useState } from "react";
import { MonoLabel, Text } from "@myos/ui";
import { PageContainer, PageContent } from "@/components/framework";
import { useIdentity } from "@/lib/identity";
import { trpc } from "@/lib/trpc/client";

function salutation(hour: number): string {
  if (hour < 5) return "You're up late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good evening";
}
import {
  NextActionHero,
  NextActionHeroSkeleton,
  ChiefInsight,
  ScheduleColumn,
  PrioritiesColumn,
} from "./command-center-panels";
import { SystemPulse } from "./system-pulse";

/**
 * Command Center (V2 Stage 1) — the primary home experience. Its job is
 * "understand my life": current context, the single next action, today's
 * important state, one restrained Chief-of-Staff recommendation, and a quiet
 * system pulse. Everything is real data from the deterministic engines and the
 * grounded Chief — nothing is invented to fill space.
 *
 * The page never blocks on its slowest query: the header, pulse and columns
 * paint immediately; the Chief hero fills in behind a skeleton.
 */
export function CommandCenter() {
  const { identity } = useIdentity();
  const now = trpc.chief.now.useQuery(undefined, { refetchInterval: 120_000 });
  const morning = trpc.chief.morning.useQuery();

  const [clock, setClock] = useState<{ label: string; hour: number } | null>(null);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock({
        label: d.toLocaleString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        hour: d.getHours(),
      });
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const nowData = now.data;
  const m = morning.data?.morning ?? null;

  // Time-appropriate greeting with the real first name (the Chief's own
  // "greeting" string is fixed to "Good morning").
  const firstName = useMemo(() => {
    const dn = identity?.preferences.displayName?.trim();
    if (dn) return dn.split(/\s+/)[0];
    return m?.greeting?.replace(/^Good morning,\s*/i, "").trim() || null;
  }, [identity, m?.greeting]);
  const greeting = clock
    ? `${salutation(clock.hour)}${firstName ? `, ${firstName}` : ""}`
    : firstName
      ? `Welcome back, ${firstName}`
      : "Welcome back";
  const summary =
    m?.opportunity ??
    (m?.biggestRisk
      ? `Today's biggest risk — ${m.biggestRisk}`
      : "Here is where things stand right now. Everything below is live.");

  return (
    <PageContainer width="content">
      <PageContent className="relative">
        {/* Ambient kinetic glow behind the hero region. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 left-1/4 -z-10 h-48 w-2/3 rounded-full opacity-70 blur-3xl"
          style={{ background: "var(--glow-ambient)" }}
        />

        <div className="flex flex-col gap-8 pb-16">
          {/* Contextual header */}
          <header className="flex flex-col gap-3">
            <MonoLabel tone="subtle" bead suppressHydrationWarning>
              {clock?.label ?? "—"}
            </MonoLabel>
            <div className="flex flex-col gap-1">
              <Text variant="display-l" className="tracking-tight" asChild>
                <h1>{greeting}.</h1>
              </Text>
              <Text variant="body-l" tone="muted" className="max-w-2xl">
                {summary}
              </Text>
            </div>
          </header>

          <SystemPulse readiness={m?.readiness ?? null} missionCount={m?.mission.length ?? 0} />

          {now.isLoading ? (
            <NextActionHeroSkeleton />
          ) : nowData ? (
            <>
              <NextActionHero data={nowData} />
              <ChiefInsight data={nowData} />
            </>
          ) : null}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <ScheduleColumn />
            <PrioritiesColumn />
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
}
