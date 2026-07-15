import { createCaptureItem } from "./capture";
import type { CaptureInput, InboxItem } from "./types";

/** Test fixtures for the inbox engine (imported by *.test.ts). */
export const at = (h: number, m = 0) => new Date(2026, 6, 7, h, m, 0);

export function makeCaptureInput(over: Partial<CaptureInput> = {}): CaptureInput {
  return {
    type: over.type ?? "text",
    content: over.content ?? "A quick captured thought",
    source: over.source ?? "quick_add",
    ...(over.title !== undefined ? { title: over.title } : {}),
    ...(over.metadata !== undefined ? { metadata: over.metadata } : {}),
  };
}

export function makeItem(over: Partial<InboxItem> = {}, now: Date = at(10)): InboxItem {
  const base = createCaptureItem(
    makeCaptureInput({
      type: over.type ?? "text",
      content: over.content ?? "A quick captured thought",
      ...(over.title !== undefined ? { title: over.title } : {}),
    }),
    now,
  );
  return {
    ...base,
    ...over,
    metadata: { ...base.metadata, ...(over.metadata ?? {}) },
    id: over.id ?? "item-1",
  };
}
