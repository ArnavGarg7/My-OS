"use client";

import { Coffee, Droplet, Footprints, Lightbulb, Play, RefreshCw } from "lucide-react";
import { Text } from "@myos/ui";
import type { FocusRecommendation } from "@myos/core/focus";

/**
 * Recommendations (Sprint 3.2). Deterministic, rule-derived nudges from the core
 * engine — take a break, hydrate, wrap up. No AI; each maps to a fixed action icon.
 */
const ACTION_ICON = {
  continue: Play,
  take_break: Coffee,
  hydrate: Droplet,
  switch_task: RefreshCw,
  recovery_walk: Footprints,
  finish_task: Lightbulb,
  resume_planner: RefreshCw,
} as const;

const TONE_CLASS = {
  info: "text-fg-muted",
  warning: "text-warning",
  success: "text-success",
} as const;

export function Recommendations({ items }: { items: FocusRecommendation[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        Recommendations
      </Text>
      <ul className="flex flex-col gap-1.5">
        {items.map((rec) => {
          const Icon = ACTION_ICON[rec.action];
          return (
            <li key={rec.id} className="flex items-start gap-2">
              <Icon size={14} aria-hidden className={`mt-0.5 shrink-0 ${TONE_CLASS[rec.tone]}`} />
              <div className="flex flex-col">
                <Text variant="body-s">{rec.title}</Text>
                <Text variant="caption" tone="subtle">
                  {rec.detail}
                </Text>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
