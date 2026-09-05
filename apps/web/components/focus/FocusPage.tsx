"use client";

import { MonoLabel, PageHeader } from "@myos/ui";
import { PageContainer, PageLoading } from "@/components/framework";
import { trpc } from "@/lib/trpc/client";
import { useFocus } from "./use-focus";
import { FocusWorkspace } from "./FocusWorkspace";
import { PomodoroCard } from "./PomodoroCard";
import { FocusOverlay } from "./FocusOverlay";
import { SessionSummary } from "./SessionSummary";
import { FocusHistory } from "./FocusHistory";

/**
 * FocusPage (Sprint 3.2). The /focus route — Focus Mode, where planned work is
 * executed. Renders the deep-work workspace plus today's derived metrics and recent
 * session history. Switches to a fullscreen overlay when the user enters focus mode.
 */
export function FocusPage() {
  const focus = useFocus();
  // Metrics live in their own query so the per-second timer tick doesn't refetch them.
  const metrics = trpc.focus.metrics.useQuery(undefined, { refetchInterval: 120_000 }).data ?? null;

  if (focus.isLoading) return <PageLoading label="Loading focus…" />;

  if (focus.fullscreen) return <FocusOverlay focus={focus} />;

  const active = Boolean(focus.active);

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <MonoLabel tone={active ? "accent" : "subtle"} bead>
            {active ? "Focus state · active" : "Focus state · idle"}
          </MonoLabel>
        }
        title="Focus"
        description="An operating mode for deep work — everything else recedes."
      />
      <div className="flex flex-col gap-8">
        <FocusWorkspace focus={focus} />
        <PomodoroCard />
        {metrics ? <SessionSummary metrics={metrics} /> : null}
        <section className="flex flex-col gap-2">
          <MonoLabel tone="subtle">Recent sessions</MonoLabel>
          <FocusHistory sessions={focus.history} />
        </section>
      </div>
    </PageContainer>
  );
}
