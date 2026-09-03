"use client";

import { useEffect, useState } from "react";
import { MonoLabel, Text } from "@myos/ui";
import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { trpc } from "@/lib/trpc/client";
import {
  NextActionHero,
  ChiefInsight,
  ScheduleColumn,
  PrioritiesColumn,
} from "./command-center-panels";
import { LifePulse } from "./life-pulse";

/**
 * Command Center (V2 Stage 1) — the primary home experience. Its job is
 * "understand my life": current context, the single next action, today's
 * important state, one restrained Chief-of-Staff recommendation, and a quiet
 * life/system pulse. Everything is real data from the deterministic engines and
 * the grounded Chief — nothing is invented to fill space.
 */
export function CommandCenter() {
  const now = trpc.chief.now.useQuery(undefined, { refetchInterval: 120_000 });
  const morning = trpc.chief.morning.useQuery();

  const [clock, setClock] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (now.isLoading) return <PageLoading label="Reading your day…" />;

  const nowData = now.data;
  const m = morning.data?.morning ?? null;
  const greeting = m?.greeting ?? "Welcome back";
  const summary =
    m?.opportunity ??
    (m?.biggestRisk
      ? `Today's biggest risk — ${m.biggestRisk}`
      : "No urgent deadlines. Here is where things stand right now.");

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
            <MonoLabel tone="subtle" suppressHydrationWarning>
              {clock ?? "—"}
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

          <LifePulse mission={m?.mission ?? []} readiness={m?.readiness ?? null} />

          {nowData ? <NextActionHero data={nowData} /> : null}
          {nowData ? <ChiefInsight data={nowData} /> : null}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <ScheduleColumn />
            <PrioritiesColumn />
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
}
