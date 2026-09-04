"use client";

import { useRouter } from "next/navigation";
import { useFocusLauncher } from "@/lib/focus/use-focus-launcher";
import {
  resolveRecommendationTarget,
  resolveSignalTarget,
  type EntityRef,
  type IntelTarget,
} from "./actions";

/**
 * The React binding for the pure intelligence→action resolver (Stage 3). Turns a
 * resolved target into a `{ label, run }` the UI can render on any intelligence
 * surface — the Chief, Signals, the Command Center — so a recommendation always
 * leads into a real operation (focus a task, open decisions, open planner) and
 * never a dead button. Reuses the Stage 2 focus launcher for execution.
 */
export interface RunnableAction {
  label: string;
  run: () => void;
}

export function useIntelligenceAction() {
  const focus = useFocusLauncher();
  const router = useRouter();

  const bind = (target: IntelTarget | null): RunnableAction | null => {
    if (!target) return null;
    if (target.kind === "focus") {
      return { label: target.label, run: () => focus.startFocusOnTask(target.taskId) };
    }
    return { label: target.label, run: () => router.push(target.href) };
  };

  return {
    pending: focus.pending,
    forRecommendation: (
      action: string,
      ref?: EntityRef | null,
      estimateMinutes?: number | null,
    ): RunnableAction | null => bind(resolveRecommendationTarget(action, ref, estimateMinutes)),
    forSignal: (relatedObjects: readonly EntityRef[]): RunnableAction | null =>
      bind(resolveSignalTarget(relatedObjects)),
  };
}
