"use client";

import { useState } from "react";
import { Badge, Button, EmptyState, Input, Text } from "@myos/ui";
import type { Asset, MaintenanceView } from "@myos/core/resource";
import { MaintenanceIcon, formatCountdown, formatMoney } from "./resource-icons";

/**
 * MaintenanceTracker (Sprint 4.3). Scheduled upkeep across assets and vehicles. Status is
 * derived by the core from the due date versus the clock — nothing here reads a stored
 * status column, because there isn't one.
 */
export function MaintenanceTracker({
  items,
  assets,
  onCreate,
  onComplete,
}: {
  items: MaintenanceView[];
  assets: Asset[];
  onCreate: (input: {
    assetId: string;
    title: string;
    dueAt: string;
    cost?: number;
    intervalDays?: number;
  }) => void;
  onComplete: (input: { id: string }) => void;
}) {
  const [assetId, setAssetId] = useState("");
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [cost, setCost] = useState("");
  const [interval, setInterval] = useState("");

  const chosen = assetId || assets[0]?.id || "";

  const submit = () => {
    if (!chosen || !title.trim() || !dueAt) return;
    onCreate({
      assetId: chosen,
      title: title.trim(),
      dueAt,
      cost: Number(cost) || 0,
      intervalDays: Number(interval) || 0,
    });
    setTitle("");
    setDueAt("");
    setCost("");
    setInterval("");
  };

  const pending = items.filter((i) => i.status !== "completed");

  return (
    <div className="flex flex-col gap-3">
      {assets.length > 0 ? (
        <div className="border-border-subtle flex flex-col gap-2 rounded-md border p-3">
          <Text variant="caption" tone="subtle">
            SCHEDULE MAINTENANCE
          </Text>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Asset"
              value={chosen}
              onChange={(e) => setAssetId(e.target.value)}
              className="border-border bg-surface text-fg h-9 rounded-md border px-2 text-sm"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <Input
              aria-label="Maintenance title"
              placeholder="What needs doing?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="max-w-52"
            />
            <Input
              aria-label="Due date"
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="max-w-40"
            />
            <Input
              aria-label="Cost"
              placeholder="Cost"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="max-w-24"
            />
            <Input
              aria-label="Repeat every (days)"
              placeholder="Every N days"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="max-w-32"
            />
            <Button size="sm" onClick={submit} disabled={!title.trim() || !dueAt}>
              Schedule
            </Button>
          </div>
        </div>
      ) : null}

      {pending.length === 0 ? (
        <EmptyState
          icon={MaintenanceIcon}
          title="Nothing scheduled"
          description="Add an asset, then schedule the upkeep it needs."
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {pending.map((item) => (
            <li
              key={item.id}
              className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="flex flex-col">
                <Text variant="body-s">{item.title}</Text>
                <Text variant="caption" tone="subtle">
                  {item.assetName} · {formatCountdown(item.daysUntilDue)}
                  {item.cost > 0 ? ` · ${formatMoney(item.cost)}` : ""}
                </Text>
              </span>
              <span className="inline-flex items-center gap-2">
                <Badge size="sm" variant={item.status === "overdue" ? "danger" : "neutral"}>
                  {item.status}
                </Badge>
                <Button size="sm" variant="secondary" onClick={() => onComplete({ id: item.id })}>
                  Done
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
