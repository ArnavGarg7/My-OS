"use client";

import { useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { Button, IconButton, Input, Text } from "@myos/ui";

/**
 * ListSection (Sprint 2.10). A tiny reusable string-list editor backing the
 * Wins / Lessons / Gratitude sections of the daily reflection.
 */
export function ListSection({
  label,
  icon,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  icon?: ReactNode;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="inline-flex items-center gap-1.5">
        {icon}
        <Text variant="label" tone="subtle">
          {label}
        </Text>
      </span>
      {items.length > 0 && (
        <ul className="flex flex-col gap-1">
          {items.map((item, i) => (
            <li key={`${item}-${i}`} className="flex items-center justify-between gap-2">
              <Text variant="body-s">• {item}</Text>
              <IconButton
                aria-label={`Remove ${item}`}
                size="icon-sm"
                variant="ghost"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              >
                <X size={13} aria-hidden />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button size="sm" variant="secondary" disabled={!draft.trim()} onClick={add}>
          <Plus size={14} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
