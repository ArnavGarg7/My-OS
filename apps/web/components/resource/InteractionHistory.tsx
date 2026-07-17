"use client";

import { useState } from "react";
import { Badge, Button, EmptyState, Input, Text } from "@myos/ui";
import {
  INTERACTION_TYPES,
  dominantChannel,
  frequencyPerMonth,
  interactionsFor,
  type InteractionType,
  type RelationshipInteraction,
} from "@myos/core/resource";
import { RelationshipIcon } from "./resource-icons";

/**
 * InteractionHistory (Sprint 4.3). The contact ledger for one person — log a conversation,
 * see the cadence you actually keep. Frequency and dominant channel are derived by the core.
 */
export function InteractionHistory({
  relationshipId,
  interactions,
  onLog,
}: {
  relationshipId: string | null;
  interactions: RelationshipInteraction[];
  onLog: (input: { relationshipId: string; type?: InteractionType; notes?: string }) => void;
}) {
  const [type, setType] = useState<InteractionType>("call");
  const [notes, setNotes] = useState("");

  if (!relationshipId) {
    return (
      <EmptyState
        icon={RelationshipIcon}
        title="Select a contact"
        description="Pick someone to see and log your history with them."
      />
    );
  }

  const mine = interactionsFor(interactions, relationshipId);
  const cadence = frequencyPerMonth(mine, new Date());
  const channel = dominantChannel(mine);

  const submit = () => {
    onLog({
      relationshipId,
      type,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
    setNotes("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Interaction type"
          value={type}
          onChange={(e) => setType(e.target.value as InteractionType)}
          className="border-border bg-surface text-fg h-9 rounded-md border px-2 text-sm"
        >
          {INTERACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
        <Input
          aria-label="Interaction notes"
          placeholder="What did you talk about?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="max-w-64"
        />
        <Button size="sm" onClick={submit}>
          Log
        </Button>
      </div>

      {mine.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" variant="neutral">
            {cadence}/month
          </Badge>
          {channel ? (
            <Badge size="sm" variant="neutral">
              mostly {channel.replace("_", " ")}
            </Badge>
          ) : null}
          <Text variant="caption" tone="subtle">
            {mine.length} interaction{mine.length === 1 ? "" : "s"} on record
          </Text>
        </div>
      ) : null}

      {mine.length === 0 ? (
        <Text variant="caption" tone="subtle">
          No history yet — log your first conversation.
        </Text>
      ) : (
        <ul className="flex flex-col gap-1">
          {mine.slice(0, 20).map((i) => (
            <li
              key={i.id}
              className="border-border-subtle flex items-center justify-between border-b py-1 last:border-0"
            >
              <span className="flex flex-col">
                <Text variant="caption">{i.type.replace("_", " ")}</Text>
                {i.notes ? (
                  <Text variant="caption" tone="subtle">
                    {i.notes}
                  </Text>
                ) : null}
              </span>
              <Text variant="caption" tone="subtle">
                {i.occurredAt.slice(0, 10)}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
