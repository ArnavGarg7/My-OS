"use client";

import { useState } from "react";
import { Bandage } from "lucide-react";
import { Badge, Button, EmptyState, Input, Text } from "@myos/ui";
import type { Injury } from "@myos/core/life";
import { INJURY_STATUS_BADGE, INJURY_STATUS_LABEL } from "./life-icons";

/**
 * InjuryLog (Sprint 4.2). Track injuries + severity. Injury burden feeds the readiness
 * expansion + the "low recovery" signal.
 */
export function InjuryLog({
  injuries,
  onAdd,
}: {
  injuries: Injury[];
  onAdd: (input: { name: string; bodyPart?: string; severity?: number }) => void;
}) {
  const [name, setName] = useState("");
  const [bodyPart, setBodyPart] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Injury…"
          aria-label="Injury name"
        />
        <Input
          value={bodyPart}
          onChange={(e) => setBodyPart(e.target.value)}
          placeholder="Body part"
          aria-label="Body part"
          className="w-32"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (!name.trim()) return;
            onAdd({
              name: name.trim(),
              ...(bodyPart.trim() ? { bodyPart: bodyPart.trim() } : {}),
              severity: 2,
            });
            setName("");
            setBodyPart("");
          }}
        >
          Log
        </Button>
      </div>
      {injuries.length === 0 ? (
        <EmptyState
          icon={Bandage}
          title="No injuries logged"
          description="Track injuries to inform readiness + recovery."
        />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {injuries.map((i) => (
            <li
              key={i.id}
              className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="flex flex-col">
                <Text variant="body-s">{i.name}</Text>
                <Text variant="caption" tone="subtle">
                  {i.bodyPart} · severity {i.severity}/5
                </Text>
              </span>
              <Badge size="sm" variant={INJURY_STATUS_BADGE[i.status]}>
                {INJURY_STATUS_LABEL[i.status]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
