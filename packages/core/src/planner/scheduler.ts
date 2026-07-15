import { comparePriority, hasCycle, type Task, type TaskDependency } from "../task";

/**
 * Scheduling order (Sprint 2.6). Deterministic: remove completed work, then
 * order the rest so dependencies come before dependents and, among independent
 * tasks, higher priority (then earlier due, then id) comes first.
 */
export function removeCompleted(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status !== "completed" && t.status !== "archived");
}

function rank(a: Task, b: Task): number {
  const p = comparePriority(a.priority, b.priority);
  if (p !== 0) return p;
  if (a.dueAt && b.dueAt && a.dueAt !== b.dueAt)
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  if (a.dueAt && !b.dueAt) return -1;
  if (!a.dueAt && b.dueAt) return 1;
  return a.id.localeCompare(b.id);
}

/**
 * Priority-aware topological order (Kahn's algorithm with a priority-sorted ready
 * queue). Falls back to a pure priority sort if the graph has a cycle.
 */
export function orderTasks(tasks: Task[], deps: TaskDependency[]): Task[] {
  if (hasCycle(deps)) return [...tasks].sort(rank);

  const ids = new Set(tasks.map((t) => t.id));
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const indegree = new Map<string, number>(tasks.map((t) => [t.id, 0]));
  const dependents = new Map<string, string[]>();

  for (const { taskId, dependsOnTaskId } of deps) {
    if (!ids.has(taskId) || !ids.has(dependsOnTaskId)) continue;
    indegree.set(taskId, (indegree.get(taskId) ?? 0) + 1);
    dependents.set(dependsOnTaskId, [...(dependents.get(dependsOnTaskId) ?? []), taskId]);
  }

  const ready = tasks.filter((t) => (indegree.get(t.id) ?? 0) === 0).sort(rank);
  const order: Task[] = [];
  while (ready.length) {
    const task = ready.shift()!;
    order.push(task);
    for (const depId of dependents.get(task.id) ?? []) {
      const next = (indegree.get(depId) ?? 0) - 1;
      indegree.set(depId, next);
      if (next === 0) {
        const t = byId.get(depId)!;
        ready.push(t);
        ready.sort(rank);
      }
    }
  }
  // Any leftover (shouldn't happen without a cycle) appended by rank.
  if (order.length !== tasks.length) {
    const placed = new Set(order.map((t) => t.id));
    order.push(...tasks.filter((t) => !placed.has(t.id)).sort(rank));
  }
  return order;
}
