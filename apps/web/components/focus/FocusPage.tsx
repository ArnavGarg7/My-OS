"use client";

import { PageHeader } from "@myos/ui";
import { PageContainer, PageLoading } from "@/components/framework";
import { trpc } from "@/lib/trpc/client";
import { useFocus } from "./use-focus";
import { FocusWorkspace } from "./FocusWorkspace";
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

  return (
    <PageContainer>
      <PageHeader title="Focus" description="Where the work actually happens." />
      <div className="flex flex-col gap-8">
        <FocusWorkspace focus={focus} />
        {metrics ? <SessionSummary metrics={metrics} /> : null}
        <section className="flex flex-col gap-2">
          <h2 className="text-fg-muted text-caption font-medium uppercase tracking-wide">
            Recent sessions
          </h2>
          <FocusHistory sessions={focus.history} />
        </section>
      </div>
    </PageContainer>
  );
}
