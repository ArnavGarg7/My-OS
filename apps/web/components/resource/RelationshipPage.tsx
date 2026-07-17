"use client";

import { useState } from "react";
import { Button, EmptyState, Input, Text } from "@myos/ui";
import {
  RELATIONSHIP_TYPES,
  type InteractionType,
  type Relationship,
  type RelationshipHealth,
  type RelationshipInteraction,
  type RelationshipType,
} from "@myos/core/resource";
import { ContactCard } from "./ContactCard";
import { InteractionHistory } from "./InteractionHistory";
import { RELATIONSHIP_TYPE_LABEL, RelationshipIcon } from "./resource-icons";

/**
 * RelationshipPage (Sprint 4.3). The personal CRM — who matters, how recently you spoke,
 * and what is owed. The list is ordered weakest-first by the core's health report, so the
 * people you are quietly losing touch with are the ones you see first.
 */
export function RelationshipPage({
  relationships,
  health,
  interactions,
  selectedId,
  onSelect,
  onCreate,
  onLogInteraction,
  onSetFollowUp,
}: {
  relationships: Relationship[];
  health: RelationshipHealth[];
  interactions: RelationshipInteraction[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (input: {
    name: string;
    type?: RelationshipType;
    company?: string;
    role?: string;
    birthday?: string | null;
  }) => void;
  onLogInteraction: (input: {
    relationshipId: string;
    type?: InteractionType;
    notes?: string;
  }) => void;
  onSetFollowUp: (input: { id: string; nextFollowUpAt: string | null }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<RelationshipType>("friend");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [birthday, setBirthday] = useState("");
  const [followUp, setFollowUp] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      type,
      ...(company.trim() ? { company: company.trim() } : {}),
      ...(role.trim() ? { role: role.trim() } : {}),
      // The form takes a full date; the engine stores a year-agnostic MM-DD.
      ...(birthday ? { birthday: birthday.slice(5) } : {}),
    });
    setName("");
    setCompany("");
    setRole("");
    setBirthday("");
  };

  // health is already sorted weakest-first by the core.
  const ordered = health
    .map((h) => relationships.find((r) => r.id === h.relationshipId))
    .filter((r): r is Relationship => r !== undefined);

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border-subtle flex flex-col gap-2 rounded-md border p-3">
        <Text variant="caption" tone="subtle">
          ADD A CONTACT
        </Text>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            aria-label="Contact name"
            placeholder="Name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-40"
          />
          <select
            aria-label="Relationship type"
            value={type}
            onChange={(e) => setType(e.target.value as RelationshipType)}
            className="border-border bg-surface text-fg h-9 rounded-md border px-2 text-sm"
          >
            {RELATIONSHIP_TYPES.map((t) => (
              <option key={t} value={t}>
                {RELATIONSHIP_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <Input
            aria-label="Company"
            placeholder="Company…"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="max-w-36"
          />
          <Input
            aria-label="Role"
            placeholder="Role…"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="max-w-36"
          />
          <Input
            aria-label="Birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="max-w-40"
          />
          <Button size="sm" onClick={submit} disabled={!name.trim()}>
            Add
          </Button>
        </div>
      </div>

      {ordered.length === 0 ? (
        <EmptyState
          icon={RelationshipIcon}
          title="No contacts yet"
          description="Add the people who matter and start keeping in touch."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            {ordered.map((r) => (
              <ContactCard
                key={r.id}
                relationship={r}
                health={health.find((h) => h.relationshipId === r.id)}
                selected={selectedId === r.id}
                onSelect={onSelect}
              />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <InteractionHistory
              relationshipId={selectedId}
              interactions={interactions}
              onLog={onLogInteraction}
            />
            {selectedId ? (
              <div className="flex flex-wrap items-center gap-2">
                <Text variant="caption" tone="subtle">
                  FOLLOW UP ON
                </Text>
                <Input
                  aria-label="Follow-up date"
                  type="date"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  className="max-w-40"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!followUp}
                  onClick={() => {
                    onSetFollowUp({ id: selectedId, nextFollowUpAt: followUp });
                    setFollowUp("");
                  }}
                >
                  Schedule
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSetFollowUp({ id: selectedId, nextFollowUpAt: null })}
                >
                  Clear
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
