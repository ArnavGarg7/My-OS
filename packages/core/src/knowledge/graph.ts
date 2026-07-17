import type { KnowledgeType, LinkKind } from "./constants";
import type { GraphEdge, GraphNode, KnowledgeGraph, KnowledgeLink } from "./types";
import { normalizeTitle } from "./wiki";

/**
 * Knowledge graph (Sprint 4.1). A PURE, deterministic graph — no force simulation, no
 * randomness. Node positions come from a stable hash of the node id, so the same graph
 * always renders identically. Edges come from explicit KnowledgeLinks plus wiki-link
 * `mentions` derived from titles. Nodes and edges are always sorted for reproducibility.
 */

export interface GraphInputNode {
  id: string;
  type: KnowledgeType;
  title: string;
  linkedTitles: string[];
}

/** Deterministic 32-bit hash (FNV-1a) → used for stable layout coordinates. */
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Map a node id to a stable [0,1) position on a golden-angle spiral (no overlap bias). */
function position(id: string, index: number, total: number): { x: number; y: number } {
  // Golden-angle spiral gives an even, deterministic spread; hash breaks ties.
  const golden = 2.399963229728653; // radians
  const t = total > 1 ? index / (total - 1) : 0;
  const radius = 0.05 + 0.45 * Math.sqrt(t);
  const angle = index * golden + (hash(id) % 360) * (Math.PI / 180) * 0.02;
  return {
    x: Number((0.5 + radius * Math.cos(angle)).toFixed(4)),
    y: Number((0.5 + radius * Math.sin(angle)).toFixed(4)),
  };
}

export function buildGraph(nodes: GraphInputNode[], links: KnowledgeLink[]): KnowledgeGraph {
  const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  const byTitle = new Map<string, string>();
  for (const n of sortedNodes) byTitle.set(normalizeTitle(n.title), n.id);
  const ids = new Set(sortedNodes.map((n) => n.id));

  const edgeSet = new Map<string, GraphEdge>();
  const addEdge = (sourceId: string, targetId: string, kind: LinkKind) => {
    if (sourceId === targetId || !ids.has(sourceId) || !ids.has(targetId)) return;
    edgeSet.set(`${sourceId}->${targetId}:${kind}`, { sourceId, targetId, kind });
  };

  // Explicit links.
  for (const l of links) addEdge(l.sourceId, l.targetId, l.kind);
  // Wiki-link `mentions` derived from titles.
  for (const n of sortedNodes) {
    for (const t of n.linkedTitles) {
      const targetId = byTitle.get(normalizeTitle(t));
      if (targetId) addEdge(n.id, targetId, "mentions");
    }
  }

  const edges = [...edgeSet.values()].sort(
    (a, b) =>
      a.sourceId.localeCompare(b.sourceId) ||
      a.targetId.localeCompare(b.targetId) ||
      a.kind.localeCompare(b.kind),
  );

  const degree = new Map<string, number>();
  for (const n of sortedNodes) degree.set(n.id, 0);
  for (const e of edges) {
    degree.set(e.sourceId, (degree.get(e.sourceId) ?? 0) + 1);
    degree.set(e.targetId, (degree.get(e.targetId) ?? 0) + 1);
  }

  const graphNodes: GraphNode[] = sortedNodes.map((n, i) => {
    const { x, y } = position(n.id, i, sortedNodes.length);
    return { id: n.id, type: n.type, title: n.title, x, y, degree: degree.get(n.id) ?? 0 };
  });

  return { nodes: graphNodes, edges };
}

/** The node with the highest degree (ties broken by title), or null. */
export function mostConnected(graph: KnowledgeGraph): GraphNode | null {
  if (graph.nodes.length === 0) return null;
  return [...graph.nodes].sort((a, b) => b.degree - a.degree || a.title.localeCompare(b.title))[0]!;
}

/** Average number of edges per node (0 when empty). */
export function averageConnections(graph: KnowledgeGraph): number {
  if (graph.nodes.length === 0) return 0;
  const total = graph.nodes.reduce((n, node) => n + node.degree, 0);
  return Number((total / graph.nodes.length).toFixed(2));
}

/** The subgraph of a node and its direct neighbours (for the inspector). */
export function neighborhood(graph: KnowledgeGraph, nodeId: string): KnowledgeGraph {
  const edges = graph.edges.filter((e) => e.sourceId === nodeId || e.targetId === nodeId);
  const ids = new Set<string>([nodeId]);
  for (const e of edges) {
    ids.add(e.sourceId);
    ids.add(e.targetId);
  }
  return { nodes: graph.nodes.filter((n) => ids.has(n.id)), edges };
}
