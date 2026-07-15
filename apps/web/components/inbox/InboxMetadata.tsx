"use client";

import { formatDate } from "@myos/shared/format";
import type { InboxItem } from "@myos/core/inbox";
import { captureLabel } from "./inbox-icons";

/** Capture metadata (Sprint 2.4): type · source · captured time · status · url. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-label text-fg-subtle">{label}</span>
      <span className="text-body-s text-fg-muted truncate text-right">{value}</span>
    </div>
  );
}

export function InboxMetadata({ item }: { item: InboxItem }) {
  const url = typeof item.metadata["url"] === "string" ? (item.metadata["url"] as string) : null;
  const destination =
    typeof item.metadata["destination"] === "string"
      ? (item.metadata["destination"] as string)
      : null;

  return (
    <div className="flex flex-col gap-2">
      <Row label="Type" value={captureLabel(item.type)} />
      <Row label="Source" value={item.source.replace(/_/g, " ")} />
      <Row label="Captured" value={formatDate(item.capturedAt)} />
      <Row label="Status" value={item.status} />
      {url ? <Row label="Link" value={url} /> : null}
      {destination ? <Row label="Filed to" value={destination} /> : null}
    </div>
  );
}
