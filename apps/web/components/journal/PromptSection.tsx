"use client";

import { Sparkles } from "lucide-react";
import { Text } from "@myos/ui";
import type { Prompt } from "@myos/core/journal";

/**
 * PromptSection (Sprint 2.10). Shows the deterministic reflection prompts for
 * the current context; clicking one seeds the editor.
 */
export function PromptSection({
  prompts,
  onPick,
}: {
  prompts: Prompt[];
  onPick: (text: string) => void;
}) {
  if (prompts.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="inline-flex items-center gap-1.5">
        <Sparkles size={14} aria-hidden className="text-accent" />
        <Text variant="label" tone="subtle">
          Prompts
        </Text>
      </span>
      <div className="flex flex-col gap-1.5">
        {prompts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p.text)}
            className="border-border hover:border-accent hover:bg-accent-muted/30 rounded-md border px-3 py-2 text-left transition-colors"
          >
            <Text variant="body-s">{p.text}</Text>
          </button>
        ))}
      </div>
    </div>
  );
}
