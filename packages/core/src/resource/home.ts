import { round2 } from "./dates";
import type { HomeInventoryItem } from "./types";

/**
 * Home management engine (Sprint 4.3). The household inventory — what is in which room,
 * how many, what it is worth. Items may link to a full Asset row when they deserve
 * depreciation, warranty and maintenance; otherwise they stay lightweight here.
 */

export function itemValue(item: HomeInventoryItem): number {
  return round2(item.quantity * item.unitValue);
}

export function totalInventoryValue(items: HomeInventoryItem[]): number {
  return round2(items.reduce((sum, i) => sum + itemValue(i), 0));
}

/** Inventory value grouped by room — the "what's where" breakdown. */
export function valueByRoom(items: HomeInventoryItem[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) {
    const room = i.room || "Unassigned";
    out[room] = round2((out[room] ?? 0) + itemValue(i));
  }
  return out;
}

export function rooms(items: HomeInventoryItem[]): string[] {
  return [...new Set(items.map((i) => i.room || "Unassigned"))].sort();
}

export function byRoom(items: HomeInventoryItem[], room: string): HomeInventoryItem[] {
  return items.filter((i) => (i.room || "Unassigned") === room);
}

/** Items promoted to full Asset rows — these depreciate; the rest are flat-valued. */
export function trackedAsAssets(items: HomeInventoryItem[]): HomeInventoryItem[] {
  return items.filter((i) => i.assetId !== null);
}
