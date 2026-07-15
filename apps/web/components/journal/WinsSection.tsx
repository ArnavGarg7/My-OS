"use client";

import { Trophy } from "lucide-react";
import { ListSection } from "./ListSection";

/** Wins list for the daily reflection (Sprint 2.10). */
export function WinsSection({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <ListSection
      label="Wins"
      icon={<Trophy size={14} aria-hidden className="text-success" />}
      placeholder="A win from today…"
      items={items}
      onChange={onChange}
    />
  );
}
