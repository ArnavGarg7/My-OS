"use client";

import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { SectionHeader, Text } from "@myos/ui";
import { useHealthController } from "./use-health";
import { HealthDashboard } from "./HealthDashboard";
import { HealthQuickLog } from "./HealthQuickLog";
import { HealthTimeline } from "./HealthTimeline";

/**
 * Health page (Sprint 2.9). The personal wellness dashboard: a readiness hero,
 * the wellness card grid, a natural-language quick-log and today's timeline.
 */
export function HealthPage() {
  const controller = useHealthController();

  if (controller.isLoading || !controller.summary) {
    return <PageLoading label="Reading your wellness…" />;
  }

  return (
    <PageContainer width="full">
      <PageContent className="gap-6">
        <div>
          <Text variant="heading-l">Health</Text>
          <Text variant="body-s" tone="subtle">
            Deterministic wellness — sleep, recovery, readiness, nutrition and hydration.
          </Text>
        </div>

        <HealthQuickLog onLog={controller.quickLog} />

        <HealthDashboard summary={controller.summary} controller={controller} />

        <section className="flex flex-col gap-2">
          <SectionHeader title="Today's timeline" />
          <HealthTimeline
            hydration={controller.hydration}
            nutrition={controller.nutrition}
            workouts={controller.workouts}
          />
        </section>
      </PageContent>
    </PageContainer>
  );
}
