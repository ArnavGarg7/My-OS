import type { Project, ProjectDependency } from "./types";

/**
 * Project dependency engine (Sprint 2.8). A DAG of projects — rejects
 * self-references, duplicates and cycles; provides deterministic topological
 * ordering. Deterministic, pure graph math.
 */
export interface DependencyResult {
  ok: boolean;
  error?: "self-reference" | "duplicate" | "cycle";
  dependencies: ProjectDependency[];
}

function adjacency(deps: ProjectDependency[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const { projectId, dependsOn } of deps) {
    if (!adj.has(projectId)) adj.set(projectId, new Set());
    adj.get(projectId)!.add(dependsOn);
  }
  return adj;
}

export function dependsOnTransitively(
  start: string,
  target: string,
  deps: ProjectDependency[],
): boolean {
  const adj = adjacency(deps);
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

export function addDependency(
  deps: ProjectDependency[],
  projectId: string,
  dependsOn: string,
): DependencyResult {
  if (projectId === dependsOn) return { ok: false, error: "self-reference", dependencies: deps };
  if (deps.some((d) => d.projectId === projectId && d.dependsOn === dependsOn))
    return { ok: false, error: "duplicate", dependencies: deps };
  if (dependsOnTransitively(dependsOn, projectId, deps))
    return { ok: false, error: "cycle", dependencies: deps };
  return { ok: true, dependencies: [...deps, { projectId, dependsOn }] };
}

export function removeDependency(
  deps: ProjectDependency[],
  projectId: string,
  dependsOn: string,
): ProjectDependency[] {
  return deps.filter((d) => !(d.projectId === projectId && d.dependsOn === dependsOn));
}

export function hasCycle(deps: ProjectDependency[]): boolean {
  const adj = adjacency(deps);
  const state = new Map<string, 1 | 2>();
  const nodes = new Set<string>();
  for (const d of deps) {
    nodes.add(d.projectId);
    nodes.add(d.dependsOn);
  }
  const visit = (node: string): boolean => {
    const s = state.get(node);
    if (s === 1) return true;
    if (s === 2) return false;
    state.set(node, 1);
    for (const next of adj.get(node) ?? []) if (visit(next)) return true;
    state.set(node, 2);
    return false;
  };
  for (const node of nodes) if (visit(node)) return true;
  return false;
}

/** The projects blocking a project (incomplete dependencies). */
export function blockingDependencies(
  projectId: string,
  deps: ProjectDependency[],
  projects: Project[],
): string[] {
  const byId = new Map(projects.map((p) => [p.id, p]));
  return deps
    .filter((d) => d.projectId === projectId)
    .map((d) => d.dependsOn)
    .filter((id) => byId.get(id)?.status !== "completed");
}

/** Topological order (dependencies first), deterministic id tie-break, or null on cycle. */
export function topologicalSort(projects: Project[], deps: ProjectDependency[]): Project[] | null {
  if (hasCycle(deps)) return null;
  const ids = projects.map((p) => p.id);
  const idSet = new Set(ids);
  const indegree = new Map<string, number>(ids.map((id) => [id, 0]));
  const dependents = new Map<string, string[]>();
  for (const { projectId, dependsOn } of deps) {
    if (!idSet.has(projectId) || !idSet.has(dependsOn)) continue;
    indegree.set(projectId, (indegree.get(projectId) ?? 0) + 1);
    dependents.set(dependsOn, [...(dependents.get(dependsOn) ?? []), projectId]);
  }
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
  const byId = new Map(projects.map((p) => [p.id, p]));
  return order.map((id) => byId.get(id)!);
}
