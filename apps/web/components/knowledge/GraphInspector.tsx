"use client";

import { Badge, Text } from "@myos/ui";
import type { KnowledgeGraph } from "@myos/core/knowledge";
import { TYPE_ICON, TYPE_LABEL } from "./knowledge-icons";

/**
 * GraphInspector (Sprint 4.1). Shows the selected graph node — its type, connection
 * degree and immediate neighbours. Pure read over the deterministic graph.
 */
export function GraphInspector({
  graph,
  selectedId,
}: {
  graph: KnowledgeGraph;
  selectedId: string | null;
}) {
  const node = graph.nodes.find((n) => n.id === selectedId) ?? null;
  if (!node) {
    return (
      <Text variant="body-s" tone="subtle">
        Select a node to inspect its connections.
      </Text>
    );
  }
  const Icon = TYPE_ICON[node.type];
  const neighbours = graph.edges
    .filter((e) => e.sourceId === node.id || e.targetId === node.id)
    .map((e) => (e.sourceId === node.id ? e.targetId : e.sourceId));
  const neighbourNodes = graph.nodes.filter((n) => neighbours.includes(n.id));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon size={16} aria-hidden />
        <Text variant="heading-s">{node.title}</Text>
        <Badge size="sm" variant="neutral">
          {TYPE_LABEL[node.type]}
        </Badge>
      </div>
      <Text variant="caption" tone="subtle">
        {node.degree} connection{node.degree === 1 ? "" : "s"}
      </Text>
      {neighbourNodes.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
            Connected
          </Text>
          {neighbourNodes.map((n) => (
            <Text key={n.id} variant="caption">
              {n.title}
            </Text>
          ))}
        </div>
      ) : null}
    </div>
  );
}
