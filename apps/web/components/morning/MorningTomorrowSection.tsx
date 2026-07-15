"use client";

import { MoonStar } from "lucide-react";
import { Text } from "@myos/ui";
import { QuickTomorrow } from "@/components/tomorrow/QuickTomorrow";
import { trpc } from "@/lib/trpc/client";

/**
 * Morning Briefing tomorrow slot (Sprint 3.1). Morning reads the plan Tomorrow
 * Studio produced — today's plan comes from last night's decisions, so there is
 * no duplicate planning. Shows readiness + a Quick Tomorrow entry point.
 */
export function MorningTomorrowSection() {
  const counts = trpc.tomorrow.counts.useQuery();
  const c = counts.data;

  return (
    <div className="flex flex-col gap-3">
      {c && c.priorityCount > 0 ? (
        <div className="flex items-center gap-2">
          <MoonStar size={16} aria-hidden className="text-fg-subtle" />
          <Text variant="body-m">
            {c.priorityCount} priorities set last night · readiness {c.readinessScore}
          </Text>
        </div>
      ) : (
        <Text variant="body-s" tone="subtle">
          Plan tomorrow tonight to start each day with a ready plan.
        </Text>
      )}
      <QuickTomorrow />
    </div>
  );
}
