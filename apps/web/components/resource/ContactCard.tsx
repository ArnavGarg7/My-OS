"use client";

import { Badge, Text } from "@myos/ui";
import type { Relationship, RelationshipHealth } from "@myos/core/resource";
import { RELATIONSHIP_TYPE_LABEL, STRENGTH_LABEL, STRENGTH_TONE } from "./resource-icons";

/**
 * ContactCard (Sprint 4.3). One person, with their derived strength. Strength and
 * engagement come from counting and calendar maths in the core — how recently you spoke and
 * how often — not from a model. A person is not a prediction.
 */
export function ContactCard({
  relationship,
  health,
  selected,
  onSelect,
}: {
  relationship: Relationship;
  health: RelationshipHealth | undefined;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const subtitle = [relationship.role, relationship.company].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={() => onSelect(relationship.id)}
      className={`border-border-subtle hover:bg-surface-subtle flex w-full flex-col gap-1 rounded-md border px-3 py-2 text-left ${
        selected ? "border-accent" : ""
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <Text variant="body-s">{relationship.name}</Text>
        {health ? (
          <Badge size="sm" variant={STRENGTH_TONE[health.strength]}>
            {STRENGTH_LABEL[health.strength]}
          </Badge>
        ) : null}
      </span>
      <Text variant="caption" tone="subtle">
        {RELATIONSHIP_TYPE_LABEL[relationship.type]}
        {subtitle ? ` · ${subtitle}` : ""}
      </Text>
      {health ? (
        <span className="flex flex-wrap items-center gap-2">
          <Text variant="caption" tone="subtle">
            {health.daysSinceContact === null
              ? "never contacted"
              : health.daysSinceContact === 0
                ? "spoke today"
                : `${health.daysSinceContact}d since contact`}
            {" · "}
            engagement {health.engagementScore}
          </Text>
          {health.followUpDue ? (
            <Badge size="sm" variant="warning">
              Follow up
            </Badge>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}
