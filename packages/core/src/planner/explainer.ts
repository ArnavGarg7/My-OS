import type { Task, TaskDependency } from "../task";
import type { BlockExplanation, PlannerBlock } from "./types";

/**
 * Explanation engine (Sprint 2.6). Every block's placement is explainable with
 * deterministic, rule-based reasons — no AI. The reasons mirror the pipeline:
 * priority, dependency position, focus window, and available slot.
 */
export function explainBlock(
  block: PlannerBlock,
  ctx: { tasks: Task[]; dependencies: TaskDependency[]; focusActive: boolean },
): BlockExplanation {
  const reasons: string[] = [];

  if (block.taskId) {
    const task = ctx.tasks.find((t) => t.id === block.taskId);
    if (task) {
      reasons.push(`${task.priority[0]!.toUpperCase()}${task.priority.slice(1)} priority`);
      const hasDeps = ctx.dependencies.some((d) => d.taskId === task.id);
      reasons.push(
        hasDeps ? "Scheduled after its dependencies" : "Dependency root — nothing blocks it",
      );
      if (task.dueAt) reasons.push("Has a due date");
    }
    if (block.type === "focus") reasons.push("Falls in your focus window");
    if (block.type === "overflow") reasons.push("Runs past working hours (overflow)");
    reasons.push("Placed in the earliest available slot");
  } else {
    switch (block.type) {
      case "break":
        reasons.push("Reserved recovery time");
        break;
      case "buffer":
        reasons.push("Buffer to reduce context switching");
        break;
      case "meeting":
        reasons.push("Fixed meeting block");
        break;
      default:
        reasons.push("Manual block");
    }
  }

  return { blockId: block.id, title: block.title, reasons };
}
