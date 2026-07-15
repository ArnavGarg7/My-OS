"use client";

import { GraduationCap, ScrollText, Sparkles } from "lucide-react";
import { Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Morning Briefing journal slot (Sprint 2.10). Editorial, read-only: yesterday's
 * reflection, the writing streak and any outstanding lesson. Derived server-side.
 */
export function MorningJournalSection() {
  const summary = trpc.journal.summary.useQuery({});
  const s = summary.data;

  if (!s) return null;

  const hasContent = s.latestReflection || s.streak.current > 0 || s.outstandingLesson;
  if (!hasContent) {
    return (
      <Text variant="body-s" tone="subtle">
        Nothing journaled yet — a quick reflection tonight starts your streak.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {s.latestReflection?.reflection && (
        <div className="flex items-start gap-2">
          <ScrollText size={15} aria-hidden className="text-fg-subtle mt-0.5" />
          <div>
            <Text variant="body-s">{s.latestReflection.reflection}</Text>
            <Text variant="caption" tone="subtle">
              Yesterday's reflection
            </Text>
          </div>
        </div>
      )}

      {s.streak.current > 0 && (
        <div className="flex items-center gap-2">
          <Sparkles size={15} aria-hidden className="text-accent" />
          <Text variant="body-s">
            {s.streak.current}-day writing streak
            {s.streak.longest > s.streak.current ? ` · best ${s.streak.longest}` : ""}
          </Text>
        </div>
      )}

      {s.outstandingLesson && (
        <div className="flex items-start gap-2">
          <GraduationCap size={15} aria-hidden className="text-fg-subtle mt-0.5" />
          <div>
            <Text variant="body-s">{s.outstandingLesson}</Text>
            <Text variant="caption" tone="subtle">
              Outstanding lesson
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}
