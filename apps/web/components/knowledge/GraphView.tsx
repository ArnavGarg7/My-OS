"use client";

import { Text } from "@myos/ui";
import type { KnowledgeGraph } from "@myos/core/knowledge";

/**
 * GraphView (Sprint 4.1). Renders the deterministic knowledge graph as an SVG using the
 * stable, hash-derived node positions from core — NO force simulation, NO randomness.
 * The same graph always renders identically. Clicking a node selects it.
 */
const TYPE_COLOR: Record<string, string> = {
  note: "var(--accent)",
  wiki: "var(--success)",
  book: "var(--warning)",
  course: "var(--accent)",
  research: "var(--fg-subtle)",
  flashcard_deck: "var(--fg-subtle)",
};

export function GraphView({
  graph,
  selectedId,
  onSelect,
}: {
  graph: KnowledgeGraph;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (graph.nodes.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No knowledge yet — create notes and wiki pages to grow the graph.
      </Text>
    );
  }
  const pos = new Map(graph.nodes.map((n) => [n.id, n]));
  const size = 600;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="border-border-subtle bg-surface-raised h-[420px] w-full rounded-md border"
      role="img"
      aria-label="Knowledge graph"
    >
      {graph.edges.map((e, i) => {
        const s = pos.get(e.sourceId);
        const t = pos.get(e.targetId);
        if (!s || !t) return null;
        return (
          <line
            key={i}
            x1={s.x * size}
            y1={s.y * size}
            x2={t.x * size}
            y2={t.y * size}
            stroke="var(--border-subtle)"
            strokeWidth={1}
          />
        );
      })}
      {graph.nodes.map((n) => {
        const active = n.id === selectedId;
        const r = Math.min(18, 5 + n.degree * 2);
        return (
          <g key={n.id} onClick={() => onSelect(n.id)} className="cursor-pointer">
            <circle
              cx={n.x * size}
              cy={n.y * size}
              r={r}
              fill={TYPE_COLOR[n.type] ?? "var(--accent)"}
              opacity={active ? 1 : 0.75}
              stroke={active ? "var(--fg)" : "none"}
              strokeWidth={active ? 2 : 0}
            />
            <text
              x={n.x * size}
              y={n.y * size - r - 3}
              textAnchor="middle"
              className="fill-fg-muted text-[9px]"
            >
              {n.title.slice(0, 18)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
