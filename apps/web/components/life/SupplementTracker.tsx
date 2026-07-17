"use client";

import { useState } from "react";
import { Button, EmptyState, Input, Text } from "@myos/ui";
import { Pill } from "lucide-react";
import type { Supplement } from "@myos/core/life";
import { MEDICATION_FREQUENCY_LABEL } from "./life-icons";

/**
 * SupplementTracker (Sprint 4.2). The supplement stack — add supplements with dosage +
 * frequency. Deterministic; read-only derivations only.
 */
export function SupplementTracker({
  supplements,
  onAdd,
}: {
  supplements: Supplement[];
  onAdd: (input: { name: string; dosage?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Supplement…"
          aria-label="Supplement name"
        />
        <Input
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="Dosage"
          aria-label="Supplement dosage"
          className="w-28"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (!name.trim()) return;
            onAdd({ name: name.trim(), ...(dosage.trim() ? { dosage: dosage.trim() } : {}) });
            setName("");
            setDosage("");
          }}
        >
          Add
        </Button>
      </div>
      {supplements.length === 0 ? (
        <EmptyState icon={Pill} title="No supplements" description="Track your supplement stack." />
      ) : (
        <ul className="flex flex-col gap-1">
          {supplements.map((s) => (
            <li
              key={s.id}
              className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-1.5"
            >
              <Text variant="body-s">{s.name}</Text>
              <Text variant="caption" tone="subtle">
                {s.dosage} · {MEDICATION_FREQUENCY_LABEL[s.frequency] ?? s.frequency}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
