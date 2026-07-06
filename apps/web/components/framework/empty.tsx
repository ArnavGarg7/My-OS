import type { ReactNode } from "react";
import {
  BookOpen,
  CheckCircle2,
  Dumbbell,
  FileText,
  FolderKanban,
  Milestone,
  SearchX,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@myos/ui";

export interface EmptyPreset {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Empty-state presets (Sprint 1.4, Part 7). All built from the one design-system
 * EmptyState. Product vocabulary lives here (app layer), keeping @myos/ui generic.
 */
export const EMPTY_PRESETS = {
  tasks: {
    icon: CheckCircle2,
    title: "No tasks yet",
    description: "Capture your first task to get started.",
  },
  notes: { icon: FileText, title: "No notes yet", description: "Write your first note." },
  projects: {
    icon: FolderKanban,
    title: "No projects yet",
    description: "Start a project to track goals and milestones.",
  },
  goals: {
    icon: Target,
    title: "No goals yet",
    description: "Set a long-term goal to work toward.",
  },
  expenses: {
    icon: Wallet,
    title: "No transactions yet",
    description: "Log an expense to see your spending.",
  },
  workouts: {
    icon: Dumbbell,
    title: "No workouts yet",
    description: "Log a workout to build your history.",
  },
  journal: {
    icon: BookOpen,
    title: "No journal entries",
    description: "Reflect on your day with a first entry.",
  },
  timeline: {
    icon: Milestone,
    title: "Your story starts here",
    description: "Milestones will appear as you make progress.",
  },
  search: { icon: SearchX, title: "No results", description: "Try a different search." },
} satisfies Record<string, EmptyPreset>;

export type EmptyPresetKey = keyof typeof EMPTY_PRESETS;

export interface PageEmptyProps {
  preset?: EmptyPresetKey;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
  hint?: ReactNode;
  className?: string;
}

/** Centered empty state — pass a `preset` or explicit icon/title/description. */
export function PageEmpty({
  preset,
  icon,
  title,
  description,
  action,
  hint,
  className,
}: PageEmptyProps) {
  const base = preset ? EMPTY_PRESETS[preset] : undefined;
  const resolvedIcon = icon ?? base?.icon;
  const resolvedTitle = title ?? base?.title ?? "Nothing here yet";
  const resolvedDescription = description ?? base?.description;

  return (
    <div className={className ?? "flex h-full items-center justify-center"}>
      <EmptyState
        title={resolvedTitle}
        {...(resolvedIcon ? { icon: resolvedIcon } : {})}
        {...(resolvedDescription ? { description: resolvedDescription } : {})}
        {...(action ? { action } : {})}
        {...(hint ? { hint } : {})}
      />
    </div>
  );
}
