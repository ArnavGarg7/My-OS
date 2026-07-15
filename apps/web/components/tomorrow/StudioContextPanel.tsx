"use client";

import { MoonStar } from "lucide-react";
import { Badge, Progress, Text } from "@myos/ui";
import { statusLabel } from "@myos/core/tomorrow";
import { trpc } from "@/lib/trpc/client";
import { STATUS_VARIANT, readinessTone } from "./tomorrow-icons";

/**
 * Tomorrow Studio context panel (Sprint 3.1). A compact snapshot of the emerging
 * plan — status, priorities, carry-forward load, readiness + checklist.
 */
export function StudioContextPanel() {
  const counts = trpc.tomorrow.counts.useQuery();
  const c = counts.data;

  return (
    <div className="flex flex-col gap-4 p-4">
      <span className="inline-flex items-center gap-1.5">
        <MoonStar size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Tomorrow</Text>
      </span>

      {c ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Badge size="sm" variant={STATUS_VARIANT[c.status]}>
              {statusLabel(c.status)}
            </Badge>
            {c.ready ? (
              <Badge size="sm" variant="success">
                Ready
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <Text variant="body-s">
              {c.priorityCount} priorities · {c.carryForwardCount} carrying
            </Text>
            <Text variant="caption" tone="subtle">
              Readiness <span className={readinessTone(c.readinessScore)}>{c.readinessScore}</span>
            </Text>
          </div>
          <div>
            <Text variant="caption" tone="subtle">
              Checklist {c.checklistPercent}%
            </Text>
            <Progress value={c.checklistPercent} />
          </div>
        </div>
      ) : (
        <Text variant="body-s" tone="subtle">
          Open Tomorrow Studio to plan your evening.
        </Text>
      )}
    </div>
  );
}
