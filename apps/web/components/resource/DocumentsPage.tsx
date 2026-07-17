"use client";

import { useState } from "react";
import { Badge, Button, EmptyState, Input, Text } from "@myos/ui";
import {
  DOCUMENT_TYPES,
  daysUntilExpiry,
  documentHealth,
  type DocumentType,
  type ImportantDocument,
} from "@myos/core/resource";
import { DocumentIcon, formatCountdown } from "./resource-icons";

/**
 * DocumentsPage (Sprint 4.3). The catalogue of what you must never lose: what it is, its
 * number, who issued it, where it lives and when it dies.
 *
 * Metadata only — there is no file upload and no encrypted vault here. Storing scans of a
 * passport is a materially different security problem, and this platform deliberately does
 * not pretend to solve it. Files may be attached in a later sprint.
 */
export function DocumentsPage({
  documents,
  onCreate,
  onRenew,
}: {
  documents: ImportantDocument[];
  onCreate: (input: {
    name: string;
    type?: DocumentType;
    documentNumber?: string;
    issuer?: string;
    location?: string;
    expiresAt?: string | null;
  }) => void;
  onRenew: (input: { id: string; expiresAt: string }) => void;
}) {
  const now = new Date();
  const [name, setName] = useState("");
  const [type, setType] = useState<DocumentType>("passport");
  const [number, setNumber] = useState("");
  const [issuer, setIssuer] = useState("");
  const [location, setLocation] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      type,
      ...(number.trim() ? { documentNumber: number.trim() } : {}),
      ...(issuer.trim() ? { issuer: issuer.trim() } : {}),
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(expiresAt ? { expiresAt } : {}),
    });
    setName("");
    setNumber("");
    setIssuer("");
    setLocation("");
    setExpiresAt("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border-subtle flex flex-col gap-2 rounded-md border p-3">
        <Text variant="caption" tone="subtle">
          CATALOGUE A DOCUMENT — METADATA ONLY, NO FILES
        </Text>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            aria-label="Document name"
            placeholder="Document name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-44"
          />
          <select
            aria-label="Document type"
            value={type}
            onChange={(e) => setType(e.target.value as DocumentType)}
            className="border-border bg-surface text-fg h-9 rounded-md border px-2 text-sm"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
          <Input
            aria-label="Document number"
            placeholder="Number…"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="max-w-36"
          />
          <Input
            aria-label="Issuer"
            placeholder="Issuer…"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            className="max-w-32"
          />
          <Input
            aria-label="Location"
            placeholder="Where is it kept?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="max-w-40"
          />
          <Input
            aria-label="Expiry date"
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

      {documents.length === 0 ? (
        <EmptyState
          icon={DocumentIcon}
          title="No documents catalogued"
          description="Record where your passport, PAN and certificates live."
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <Text variant="caption" tone="subtle">
              {documents.length} document{documents.length === 1 ? "" : "s"}
            </Text>
            <Badge
              size="sm"
              variant={documentHealth(documents, now) === 100 ? "success" : "warning"}
            >
              {documentHealth(documents, now)}% valid
            </Badge>
          </div>
          <ul className="flex flex-col gap-1">
            {documents.map((d) => (
              <DocumentRow key={d.id} doc={d} now={now} onRenew={onRenew} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function DocumentRow({
  doc,
  now,
  onRenew,
}: {
  doc: ImportantDocument;
  now: Date;
  onRenew: (input: { id: string; expiresAt: string }) => void;
}) {
  const [next, setNext] = useState("");
  const days = daysUntilExpiry(doc, now);
  return (
    <li className="border-border-subtle flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
      <span className="flex flex-col">
        <Text variant="body-s">{doc.name}</Text>
        <Text variant="caption" tone="subtle">
          {doc.type.replace("_", " ")}
          {doc.documentNumber ? ` · ${doc.documentNumber}` : ""}
          {doc.location ? ` · ${doc.location}` : ""}
        </Text>
      </span>
      <span className="inline-flex items-center gap-2">
        {days === null ? (
          <Badge size="sm" variant="neutral">
            No expiry
          </Badge>
        ) : (
          <Badge size="sm" variant={days < 0 ? "danger" : days <= 90 ? "warning" : "success"}>
            {formatCountdown(days)}
          </Badge>
        )}
        <Input
          aria-label={`Renew ${doc.name}`}
          type="date"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="max-w-36"
        />
        <Button
          size="sm"
          variant="ghost"
          disabled={!next}
          onClick={() => {
            onRenew({ id: doc.id, expiresAt: next });
            setNext("");
          }}
        >
          Renew
        </Button>
      </span>
    </li>
  );
}
