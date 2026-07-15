"use client";

import { Timer } from "lucide-react";
import { Badge, Progress, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { STATUS_LABEL, READINESS_LABEL, READINESS_TONE } from "./focus-icons";
import { formatMinutes } from "./format";

/**
 * Focus context panel (Sprint 3.2). Route-aware snapshot on /focus — current session
 * status, remaining time, interruptions, readiness and the top recommendation.
 */
export function FocusContextPanel() {
  const summary = trpc.focus.summary.useQuery();
  const readiness = trpc.focus.readiness.useQuery();
  const recommendations = trpc.focus.recommendations.useQuery();
  const s = summary.data;
  const r = readiness.data;
  const topRec = recommendations.data?.[0];

  return (
    <div className="flex flex-col gap-4 p-4">
      <span className="inline-flex items-center gap-1.5">
        <Timer size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Focus</Text>
      </span>

      {s ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Badge size="sm" variant={s.status === "running" ? "success" : "neutral"}>
              {STATUS_LABEL[s.status]}
            </Badge>
            {s.active ? (
              <Badge size="sm" variant="accent">
                {s.remainingMinutes}m left
              </Badge>
            ) : null}
          </div>
          <Text variant="body-s">
            {formatMinutes(s.deepWorkMinutesToday)} deep work · {s.completedToday} done ·{" "}
            {s.interruptionsToday} interruptions
          </Text>
        </div>
      ) : null}

      {r ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            Readiness <span className={READINESS_TONE[r.level]}>{READINESS_LABEL[r.level]}</span>
          </Text>
          <Progress value={r.score} />
        </div>
      ) : null}

      {topRec ? (
        <div className="border-border flex flex-col gap-0.5 rounded-lg border p-2.5">
          <Text variant="body-s">{topRec.title}</Text>
          <Text variant="caption" tone="subtle">
            {topRec.detail}
          </Text>
        </div>
      ) : null}
    </div>
  );
}
