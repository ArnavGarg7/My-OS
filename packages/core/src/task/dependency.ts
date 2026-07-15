import type { Task, TaskDependency } from "./types";

/**
 * Dependency engine (Sprint 2.5). A task may depend on other tasks. The engine
 * guarantees a DAG: no self-references, no duplicate edges, and no cycles.
 * Deterministic — pure graph math, no storage.
 */

export interface DependencyResult {
  ok: boolean;
  error?: "self-reference" | "duplicate" | "cycle" | "missing-task";
  dependencies: TaskDependency[];
}

/** Adjacency: task → the tasks it depends on. */
function buildAdjacency(deps: TaskDependency[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const { taskId, dependsOnTaskId } of deps) {
    if (!adj.has(taskId)) adj.set(taskId, new Set());
    adj.get(taskId)!.add(dependsOnTaskId);
  }
  return adj;
}

/** Does following "depends-on" edges from `start` ever reach `target`? */
export function dependsOnTransitively(
  start: string,
  target: string,
  deps: TaskDependency[],
): boolean {
  const adj = buildAdjacency(deps);
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const node = stack.pop()!;
    if (node === target) return true;
    if (seen.has(node)) continue;
    seen.add(node);
    for (const next of adj.get(node) ?? []) stack.push(next);
  }
  return false;
}

/**
 * Add an edge (taskId depends on dependsOnTaskId) with full validation. Returns
 * the next immutable dependency set, or an error and the unchanged set.
 */
export function addDependency(
  deps: TaskDependency[],
  taskId: string,
  dependsOnTaskId: string,
): DependencyResult {
  if (taskId === dependsOnTaskId) {
    return { ok: false, error: "self-reference", dependencies: deps };
  }
  if (deps.some((d) => d.taskId === taskId && d.dependsOnTaskId === dependsOnTaskId)) {
    return { ok: false, error: "duplicate", dependencies: deps };
  }
  // Adding taskId→dependsOnTaskId creates a cycle iff dependsOnTaskId already
  // (transitively) depends on taskId.
  if (dependsOnTransitively(dependsOnTaskId, taskId, deps)) {
    return { ok: false, error: "cycle", dependencies: deps };
  }
  return { ok: true, dependencies: [...deps, { taskId, dependsOnTaskId }] };
}

export function removeDependency(
  deps: TaskDependency[],
  taskId: string,
  dependsOnTaskId: string,
): TaskDependency[] {
  return deps.filter((d) => !(d.taskId === taskId && d.dependsOnTaskId === dependsOnTaskId));
}

/** True if the dependency set contains any cycle. */
export function hasCycle(deps: TaskDependency[]): boolean {
  const adj = buildAdjacency(deps);
  const state = new Map<string, 0 | 1 | 2>(); // 0 visiting, 2 done
  const nodes = new Set<string>();
  for (const d of deps) {
    nodes.add(d.taskId);
    nodes.add(d.dependsOnTaskId);
  }
  const visit = (node: string): boolean => {
    const s = state.get(node);
    if (s === 1) return true; // back-edge → cycle
    if (s === 2) return false;
    state.set(node, 1);
    for (const next of adj.get(node) ?? []) {
      if (visit(next)) return true;
    }
    state.set(node, 2);
    return false;
  };
  for (const node of nodes) {
    if (visit(node)) return true;
  }
  return false;
}

/** The direct tasks this task depends on. */
export function directDependencies(taskId: string, deps: TaskDependency[]): string[] {
  return deps.filter((d) => d.taskId === taskId).map((d) => d.dependsOnTaskId);
}

/** The incomplete dependencies blocking a task (given the full task list). */
export function blockingDependencies(
  taskId: string,
  deps: TaskDependency[],
  tasks: Task[],
): string[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  return directDependencies(taskId, deps).filter((id) => byId.get(id)?.status !== "completed");
}

/**
 * Topological order (dependencies before dependents). Deterministic tie-break by
 * id. Returns null if the graph has a cycle.
 */
export function topologicalSort(tasks: Task[], deps: TaskDependency[]): Task[] | null {
  if (hasCycle(deps)) return null;
  const ids = tasks.map((t) => t.id);
  const idSet = new Set(ids);
  const adj = buildAdjacency(deps);

  // in-degree = number of dependencies (that exist in the task set)
  const indegree = new Map<string, number>(ids.map((id) => [id, 0]));
  const dependents = new Map<string, string[]>(); // dependency → dependents
  for (const { taskId, dependsOnTaskId } of deps) {
    if (!idSet.has(taskId) || !idSet.has(dependsOnTaskId)) continue;
    indegree.set(taskId, (indegree.get(taskId) ?? 0) + 1);
    if (!dependents.has(dependsOnTaskId)) dependents.set(dependsOnTaskId, []);
    dependents.get(dependsOnTaskId)!.push(taskId);
  }
  void adj;

  const ready = ids.filter((id) => (indegree.get(id) ?? 0) === 0).sort();
  const order: string[] = [];
  while (ready.length) {
    const id = ready.shift()!;
    order.push(id);
    for (const dep of (dependents.get(id) ?? []).sort()) {
      const next = (indegree.get(dep) ?? 0) - 1;
      indegree.set(dep, next);
      if (next === 0) {
        ready.push(dep);
        ready.sort();
      }
    }
  }
  if (order.length !== ids.length) return null;
  const byId = new Map(tasks.map((t) => [t.id, t]));
  return order.map((id) => byId.get(id)!);
}
