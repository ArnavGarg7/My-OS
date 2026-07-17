"use client";

import { Badge, Text } from "@myos/ui";
import type { Achievement } from "@myos/core/intelligence";
import { AchievementIcon } from "./intelligence-icons";

/**
 * Achievements (Sprint 4.4). Every badge, unlocked or not, from the explicit rule table.
 * Locked ones show muted so progress is visible.
 */
export function Achievements({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {achievements.map((a) => {
        const unlocked = a.unlockedAt !== null;
        return (
          <div
            key={a.id}
            className={`border-border-subtle flex items-center gap-2 rounded-md border px-3 py-2 ${unlocked ? "" : "opacity-50"}`}
          >
            <AchievementIcon
              size={16}
              aria-hidden
              className={unlocked ? "text-accent" : "text-fg-subtle"}
            />
            <span className="flex flex-1 flex-col">
              <Text variant="body-s">{a.title}</Text>
              <Text variant="caption" tone="subtle">
                {a.description}
              </Text>
            </span>
            {unlocked ? (
              <Badge size="sm" variant="success">
                Unlocked
              </Badge>
            ) : (
              <Badge size="sm" variant="neutral">
                Locked
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
