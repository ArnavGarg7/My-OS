import { MODULE_DEPENDENCIES, type OrchestrationModule } from "./constants";

/**
 * Dependency graph (Sprint 3.5). Pure, reusable DAG utilities over an adjacency map
 * (module → downstream modules). Supports topological ordering, cycle detection,
 * reachability (affected set) and incremental subgraphs. Deterministic — stable order.
 */
export type Adjacency = Record<string, string[]>;

/** Modules reachable downstream from `start` (the "affected" set), excluding start. */
export function affectedModules(
  start: OrchestrationModule,
  graph: Adjacency = MODULE_DEPENDENCIES,
): OrchestrationModule[] {
  const seen = new Set<string>();
  const stack = [...(graph[start] ?? [])];
  while (stack.length > 0) {
    const node = stack.shift()!;
    if (seen.has(node)) continue;
    seen.add(node);
    for (const next of graph[node] ?? []) if (!seen.has(next)) stack.push(next);
  }
  return [...seen] as OrchestrationModule[];
}

/**
 * Deterministic topological order of the subgraph induced by `nodes`. Ties broken by
 * the input order of `nodes` for reproducibility. Throws if the subgraph has a cycle.
 */
export function topologicalOrder(nodes: string[], graph: Adjacency): string[] {
  const set = new Set(nodes);
  const indegree = new Map<string, number>();
  for (const n of nodes) indegree.set(n, 0);
  for (const n of nodes) {
    for (const m of graph[n] ?? []) {
      if (set.has(m)) indegree.set(m, (indegree.get(m) ?? 0) + 1);
    }
  }
  // Kahn's algorithm; preserve input order among zero-indegree nodes.
  const order: string[] = [];
  const ready = nodes.filter((n) => (indegree.get(n) ?? 0) === 0);
  while (ready.length > 0) {
    const n = ready.shift()!;
    order.push(n);
    for (const m of graph[n] ?? []) {
      if (!set.has(m)) continue;
      const d = (indegree.get(m) ?? 0) - 1;
      indegree.set(m, d);
      if (d === 0) ready.push(m);
    }
  }
  if (order.length !== nodes.length) {
    throw new Error("Cycle detected in orchestration dependency graph");
  }
  return order;
}

/** Detect whether a graph (restricted to `nodes`) contains a cycle. Never throws. */
export function hasCycle(nodes: string[], graph: Adjacency): boolean {
  try {
    topologicalOrder(nodes, graph);
    return false;
  } catch {
    return true;
  }
}

/** The subgraph adjacency restricted to a set of nodes (for incremental updates). */
export function subgraph(nodes: string[], graph: Adjacency): Adjacency {
  const set = new Set(nodes);
  const out: Adjacency = {};
  for (const n of nodes) out[n] = (graph[n] ?? []).filter((m) => set.has(m));
  return out;
}
