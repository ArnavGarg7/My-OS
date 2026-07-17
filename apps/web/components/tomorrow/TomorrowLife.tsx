"use client";

import { Activity } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Tomorrow Studio life planning (Sprint 4.2). Tomorrow's routines + workout, the recovery
 * recommendation and a habit forecast. Read-only, derived from the Life Platform.
 */
export function TomorrowLife() {
  const summary = trpc.life.summary.useQuery();
  const readiness = trpc.life.readiness.useQuery();
  const s = summary.data;
  const r = readiness.data;
  if (!s) return null;

  return (
    <div className="border-border-subtle flex flex-col gap-2 rounded-md border px-3 py-2">
      <span className="inline-flex items-center gap-2">
        <Activity size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="body-s">Life for tomorrow</Text>
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {s.nextRoutine ? (
          <Badge size="sm" variant="neutral">
            Routine: {s.nextRoutine}
          </Badge>
        ) : null}
        <Badge size="sm" variant="accent">
          {s.activeHabits} habits to keep
        </Badge>
        {r ? (
          <Badge size="sm" variant={r.trainingRecommendation === "rest" ? "danger" : "success"}>
            Training: {r.trainingRecommendation}
          </Badge>
        ) : null}
        {s.medicationDue ? (
          <Badge size="sm" variant="warning">
            Medication outstanding
          </Badge>
        ) : null}
      </div>
      {r && r.recovery < 50 ? (
        <Text variant="caption" tone="subtle">
          Recovery is low — plan a lighter day and protect sleep tonight.
        </Text>
      ) : null}
    </div>
  );
}
