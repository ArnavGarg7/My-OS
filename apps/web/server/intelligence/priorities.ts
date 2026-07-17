import "server-only";
import {
  attentionItems,
  priorityMatrix,
  tomorrowPriorities,
  type AttentionItem,
} from "@myos/core/intelligence";
import type { PriorityItem } from "@myos/core/intelligence";
import type { Database } from "@myos/db";
import { composeInput } from "./composer";

/**
 * Server attention + priority views (Sprint 4.4). The deterministic attention engine and the
 * importance×urgency matrix, over the composed input. Tomorrow Studio reads `tomorrow`.
 */
export async function attention(db: Database, tz: string): Promise<AttentionItem[]> {
  return attentionItems(await composeInput(db, tz));
}

export async function matrix(db: Database, tz: string): Promise<PriorityItem[]> {
  return priorityMatrix(await composeInput(db, tz));
}

export async function tomorrow(db: Database, tz: string): Promise<AttentionItem[]> {
  return tomorrowPriorities(await composeInput(db, tz));
}
