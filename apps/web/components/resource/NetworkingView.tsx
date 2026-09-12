"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@myos/ui";
import {
  NETWORKING_KINDS,
  countEventsByKind,
  mostConnected,
  professionalContacts,
  type NetworkingKind,
  type Relationship,
  type RelationshipEvent,
} from "@myos/core/resource";
import { NETWORKING_KIND_ICON, NETWORKING_KIND_LABEL, RelationshipIcon } from "./resource-icons";
import { TypePicker } from "./TypePicker";

const NETWORKING_OPTIONS = NETWORKING_KINDS.map((k) => ({
  value: k,
  label: NETWORKING_KIND_LABEL[k],
  icon: NETWORKING_KIND_ICON[k],
}));

/**
 * NetworkingView (Sprint 4.3). The professional ledger — conferences, referrals,
 * introductions, collaborations, recruitment. The platform records what happened; it does
 * not rank people.
 */
export function NetworkingView({
  relationships,
  events,
  onLogEvent,
}: {
  relationships: Relationship[];
  events: RelationshipEvent[];
  onLogEvent: (input: { relationshipId: string; title: string; kind?: string }) => void;
}) {
  const [relationshipId, setRelationshipId] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<NetworkingKind>("conference");

  const professional = professionalContacts(relationships);
  const chosen = relationshipId || relationships[0]?.id || "";
  const counts = countEventsByKind(events);
  const ranked = mostConnected(relationships, events);

  const submit = () => {
    if (!chosen || !title.trim()) return;
    onLogEvent({ relationshipId: chosen, title: title.trim(), kind });
    setTitle("");
  };

  return (
    <div className="flex flex-col gap-3">
      {relationships.length > 0 ? (
        <div className="border-border-subtle flex flex-col gap-2 rounded-md border p-3">
          <Text variant="caption" tone="subtle">
            LOG A NETWORKING EVENT
          </Text>
          <TypePicker
            ariaLabel="Event kind"
            options={NETWORKING_OPTIONS}
            value={kind}
            onChange={setKind}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={chosen} onValueChange={(v) => v && setRelationshipId(v)}>
              <SelectTrigger aria-label="Contact" className="max-w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationships.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              aria-label="Event title"
              placeholder="What happened?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="max-w-52"
            />
            <Button size="sm" onClick={submit} disabled={!title.trim()}>
              Log
            </Button>
          </div>
        </div>
      ) : null}

      {Object.keys(counts).length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(counts).map(([k, n]) => (
            <Badge key={k} size="sm" variant="neutral">
              {NETWORKING_KIND_LABEL[k as NetworkingKind] ?? k}: {n}
            </Badge>
          ))}
        </div>
      ) : null}

      {professional.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            PROFESSIONAL CONTACTS ({professional.length})
          </Text>
          <div className="flex flex-wrap gap-2">
            {professional.map((r) => (
              <Badge key={r.id} size="sm" variant="accent">
                {r.name}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {ranked.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            MOST CONNECTED
          </Text>
          {ranked.map((x) => (
            <div key={x.relationship.id} className="flex items-center justify-between">
              <Text variant="body-s">{x.relationship.name}</Text>
              <Text variant="caption" tone="subtle">
                {x.events} event{x.events === 1 ? "" : "s"}
              </Text>
            </div>
          ))}
        </div>
      ) : null}

      {events.length === 0 ? (
        <EmptyState
          icon={RelationshipIcon}
          title="No networking history"
          description="Log a conference, referral or introduction to build the ledger."
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {events.slice(0, 20).map((e) => {
            const Icon = NETWORKING_KIND_ICON[e.kind as NetworkingKind] ?? RelationshipIcon;
            return (
              <li
                key={e.id}
                className="border-border-subtle flex items-center justify-between border-b py-1 last:border-0"
              >
                <span className="flex items-center gap-2">
                  <Icon size={14} aria-hidden className="text-fg-subtle shrink-0" />
                  <span className="flex flex-col">
                    <Text variant="caption">{e.title}</Text>
                    <Text variant="caption" tone="subtle">
                      {NETWORKING_KIND_LABEL[e.kind as NetworkingKind] ?? e.kind}
                    </Text>
                  </span>
                </span>
                <Text variant="caption" tone="subtle">
                  {e.occurredAt.slice(0, 10)}
                </Text>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
