"use client";

import { AlertTriangle, CalendarClock } from "lucide-react";
import { Badge, Button, Card, MonoLabel, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

const CONFIDENCE_TONE: Record<string, "success" | "accent" | "warning" | "neutral"> = {
  very_high: "success",
  high: "success",
  medium: "accent",
  low: "warning",
  unknown: "neutral",
};

/**
 * Adaptive plan realism (Stage 5). Grounded in the user's real capacity, committed
 * meetings, historical completion rate and learned estimation bias — it flags an
 * OVERLOADED day and proposes explainable deferrals. Recommendation-only: nothing
 * is rearranged silently; the user moves a task with one click (a real, reversible
 * task update). Renders nothing when the day is realistic or there's no plan yet.
 */
export function AdaptivePlanCard() {
  const plan = trpc.adaptation.todayPlan.useQuery(undefined, { staleTime: 120_000 });
  const utils = trpc.useUtils();
  const update = trpc.task.update.useMutation({
    onSuccess: () => {
      void utils.task.list.invalidate();
      void utils.task.counts.invalidate();
      void utils.adaptation.todayPlan.invalidate();
    },
  });

  const p = plan.data;
  if (!p || !p.overloaded || p.deferSuggestions.length === 0) return null;

  const moveToTomorrow = (id: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    update.mutate({ id, dueAt: tomorrow.toISOString() });
  };

  return (
    <Card variant="insight" padding="lg" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="bg-warning-subtle text-warning flex size-8 shrink-0 items-center justify-center rounded-lg">
            <AlertTriangle size={15} aria-hidden />
          </span>
          <div className="flex flex-col gap-0.5">
            <MonoLabel tone="warning">Adaptive planning</MonoLabel>
            <Text variant="heading-s">{p.headline}</Text>
          </div>
        </div>
        <Badge variant={CONFIDENCE_TONE[p.confidence.level] ?? "neutral"} size="sm">
          {p.confidence.level.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* The grounded reasoning — every number is real. */}
      <ul className="flex flex-col gap-0.5">
        {p.reasons.map((r, i) => (
          <li key={i} className="text-body-s text-fg-muted flex gap-2">
            <span aria-hidden className="text-fg-subtle">
              ·
            </span>
            {r}
          </li>
        ))}
      </ul>

      <div className="border-border flex flex-col gap-1.5 border-t pt-3">
        <Text variant="body-s" tone="muted">
          Consider moving {p.deferSuggestions.length} lower-priority task
          {p.deferSuggestions.length === 1 ? "" : "s"} to tomorrow:
        </Text>
        {p.deferSuggestions.map((t) => (
          <div
            key={t.id}
            className="border-border bg-elevated flex items-center justify-between gap-2 rounded-md border px-3 py-2"
          >
            <Text variant="body-s" truncate>
              {t.title}
            </Text>
            <Button
              variant="secondary"
              size="sm"
              disabled={update.isPending}
              onClick={() => moveToTomorrow(t.id)}
              leftIcon={<CalendarClock size={13} aria-hidden />}
            >
              Move to tomorrow
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
