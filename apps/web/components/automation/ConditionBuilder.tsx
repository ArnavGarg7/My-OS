"use client";

import { Text } from "@myos/ui";
import type { Condition, ConditionGroup } from "@myos/core/automation";

/**
 * ConditionBuilder (Sprint 3.4). Editorial "if" section — renders the condition tree
 * readably (AND/OR/NOT groups + leaf conditions). Read-first; no node graph.
 */
function isGroup(node: Condition | ConditionGroup): node is ConditionGroup {
  return (node as ConditionGroup).combinator !== undefined;
}

function LeafRow({ condition }: { condition: Condition }) {
  const op = condition.operator.replace(/_/g, " ");
  return (
    <li className="text-fg-muted text-sm">
      {condition.timeCondition ? (
        <>
          time is{" "}
          <span className="text-fg font-medium">{condition.timeCondition.replace(/_/g, " ")}</span>
        </>
      ) : (
        <>
          <span className="text-fg font-medium">{condition.field}</span> {op}{" "}
          <span className="text-fg font-medium">{formatValue(condition.value)}</span>
        </>
      )}
    </li>
  );
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join("–");
  return String(value);
}

function GroupBlock({ group }: { group: ConditionGroup }) {
  if (group.conditions.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No conditions — always passes.
      </Text>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <Text variant="caption" tone="subtle" className="uppercase">
        {group.combinator}
      </Text>
      <ul className="border-border ml-2 flex flex-col gap-1 border-l pl-3">
        {group.conditions.map((node, i) =>
          isGroup(node) ? (
            <li key={i}>
              <GroupBlock group={node} />
            </li>
          ) : (
            <LeafRow key={node.id} condition={node} />
          ),
        )}
      </ul>
    </div>
  );
}

export function ConditionBuilder({ conditions }: { conditions: ConditionGroup }) {
  return (
    <section className="flex flex-col gap-1">
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        If
      </Text>
      <div className="border-border rounded-lg border p-3">
        <GroupBlock group={conditions} />
      </div>
    </section>
  );
}
