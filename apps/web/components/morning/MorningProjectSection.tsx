"use client";

import { Flag, FolderKanban, Target } from "lucide-react";
import { Progress, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

function daysUntil(iso: string): string {
  const day = 86_400_000;
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / day);
  if (d <= 0) return "due today";
  return `due in ${d} day${d === 1 ? "" : "s"}`;
}

/**
 * Morning Briefing project slot (Sprint 2.8.5). Editorial, read-only: Project
 * Health, the most Critical Milestone, and Today's Goals (portfolio outcomes).
 * Everything is derived server-side; nothing is editable here.
 */
export function MorningProjectSection() {
  const portfolio = trpc.project.portfolio.useQuery();
  const p = portfolio.data;

  if (!p || p.projectCount === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No active projects yet — create one to see health and milestones here.
      </Text>
    );
  }

  const critical = p.upcomingDeadlines[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <FolderKanban size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="body-m">
          {p.activeCount} active {p.activeCount === 1 ? "project" : "projects"} ·{" "}
          {p.overallCompletion}% complete
          {p.atRiskCount > 0 ? ` · ${p.atRiskCount} at risk` : ""}
        </Text>
      </div>
      <Progress value={p.overallCompletion} />

      {critical ? (
        <div className="flex items-start gap-2">
          <Flag size={15} aria-hidden className="text-warning mt-0.5" />
          <div>
            <Text variant="body-s">Critical milestone: {critical.title}</Text>
            <Text variant="caption" tone="subtle">
              {daysUntil(critical.dueDate)}
            </Text>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Target size={15} aria-hidden className="text-fg-subtle" />
        <Text variant="body-s" tone="subtle">
          Today's goals: {p.openMilestones} open milestone{p.openMilestones === 1 ? "" : "s"}
          {p.blockedTasks > 0 ? ` · ${p.blockedTasks} blocked` : ""}
        </Text>
      </div>
    </div>
  );
}
