"use client";

import { useState } from "react";
import { Badge, Button, EmptyState, Input, Text } from "@myos/ui";
import {
  TRAVEL_DOCUMENT_TYPES,
  countries,
  expiringTravelDocuments,
  type TravelDocument,
  type TravelDocumentType,
} from "@myos/core/resource";
import { TravelIcon, formatCountdown } from "./resource-icons";

/**
 * TravelDocuments (Sprint 4.3). Passports, visas, travel insurance, vaccination records and
 * memberships — everything with an expiry that strands you at a border. Metadata only,
 * same as the document catalogue.
 */
export function TravelDocuments({
  documents,
  onCreate,
}: {
  documents: TravelDocument[];
  onCreate: (input: {
    name: string;
    type?: TravelDocumentType;
    reference?: string;
    country?: string;
    expiresAt?: string | null;
  }) => void;
}) {
  const now = new Date();
  const [name, setName] = useState("");
  const [type, setType] = useState<TravelDocumentType>("passport");
  const [reference, setReference] = useState("");
  const [country, setCountry] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      type,
      ...(reference.trim() ? { reference: reference.trim() } : {}),
      ...(country.trim() ? { country: country.trim() } : {}),
      ...(expiresAt ? { expiresAt } : {}),
    });
    setName("");
    setReference("");
    setCountry("");
    setExpiresAt("");
  };

  const expiring = expiringTravelDocuments(documents, now);
  const places = countries(documents);

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border-subtle flex flex-col gap-2 rounded-md border p-3">
        <Text variant="caption" tone="subtle">
          ADD A TRAVEL DOCUMENT
        </Text>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            aria-label="Travel document name"
            placeholder="Document name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-44"
          />
          <select
            aria-label="Travel document type"
            value={type}
            onChange={(e) => setType(e.target.value as TravelDocumentType)}
            className="border-border bg-surface text-fg h-9 rounded-md border px-2 text-sm"
          >
            {TRAVEL_DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
          <Input
            aria-label="Reference"
            placeholder="Reference…"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="max-w-36"
          />
          <Input
            aria-label="Country"
            placeholder="Country…"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="max-w-32"
          />
          <Input
            aria-label="Travel document expiry"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="max-w-40"
          />
          <Button size="sm" onClick={submit} disabled={!name.trim()}>
            Add
          </Button>
        </div>
      </div>

      {expiring.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            EXPIRING SOON
          </Text>
          {expiring.map((r) => (
            <div key={r.id} className="flex items-center justify-between">
              <Text variant="body-s">{r.name}</Text>
              <Badge size="sm" variant={r.expired ? "danger" : "warning"}>
                {formatCountdown(r.daysUntil)}
              </Badge>
            </div>
          ))}
        </div>
      ) : null}

      {documents.length === 0 ? (
        <EmptyState
          icon={TravelIcon}
          title="No travel documents"
          description="Track passports, visas and memberships before they lapse."
        />
      ) : (
        <>
          {places.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Text variant="caption" tone="subtle">
                COUNTRIES
              </Text>
              {places.map((c) => (
                <Badge key={c} size="sm" variant="neutral">
                  {c}
                </Badge>
              ))}
            </div>
          ) : null}
          <ul className="flex flex-col gap-1">
            {documents.map((d) => (
              <li
                key={d.id}
                className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="flex flex-col">
                  <Text variant="body-s">{d.name}</Text>
                  <Text variant="caption" tone="subtle">
                    {d.type.replace("_", " ")}
                    {d.country ? ` · ${d.country}` : ""}
                    {d.reference ? ` · ${d.reference}` : ""}
                  </Text>
                </span>
                {d.expiresAt ? (
                  <Text variant="caption" tone="subtle">
                    expires {d.expiresAt}
                  </Text>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
