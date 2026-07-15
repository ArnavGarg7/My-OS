"use client";

import { useEffect, useState } from "react";
import { Textarea, Text } from "@myos/ui";

/**
 * NotesPanel (Sprint 3.2). Lightweight free-text capture for the session — thoughts,
 * blockers, what to pick up next. Debounced-on-blur save so typing stays smooth.
 */
export function NotesPanel({
  value,
  onSave,
  disabled,
}: {
  value: string;
  onSave: (notes: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <div className="flex flex-col gap-1.5">
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        Notes
      </Text>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft !== value && onSave(draft)}
        placeholder="Capture a thought or blocker…"
        rows={3}
        disabled={disabled}
      />
    </div>
  );
}
