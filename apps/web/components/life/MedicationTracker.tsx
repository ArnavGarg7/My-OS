"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Badge, Button, EmptyState, Input, Text } from "@myos/ui";
import type { Medication } from "@myos/core/life";
import { MEDICATION_FREQUENCY_LABEL, MedicationIcon } from "./life-icons";

/**
 * MedicationTracker (Sprint 4.2). Add medications and log doses. Adherence + "due" are
 * derived deterministically by the medication engine.
 */
export function MedicationTracker({
  medications,
  onAdd,
  onLog,
}: {
  medications: Medication[];
  onAdd: (input: { name: string; dosage?: string }) => void;
  onLog: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Medication…"
          aria-label="Medication name"
        />
        <Input
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="Dosage"
          aria-label="Dosage"
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
      {medications.length === 0 ? (
        <EmptyState
          icon={MedicationIcon}
          title="No medications"
          description="Track your medications + doses."
        />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {medications.map((m) => (
            <li
              key={m.id}
              className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="flex items-center gap-2">
                <MedicationIcon size={14} aria-hidden className="text-fg-subtle" />
                <span className="flex flex-col">
                  <Text variant="body-s">{m.name}</Text>
                  <Text variant="caption" tone="subtle">
                    {m.dosage} · {MEDICATION_FREQUENCY_LABEL[m.frequency] ?? m.frequency}
                  </Text>
                </span>
                {!m.active ? (
                  <Badge size="sm" variant="neutral">
                    Inactive
                  </Badge>
                ) : null}
              </span>
              <Button size="sm" variant="ghost" onClick={() => onLog(m.id)}>
                <Check size={13} aria-hidden /> Log dose
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
