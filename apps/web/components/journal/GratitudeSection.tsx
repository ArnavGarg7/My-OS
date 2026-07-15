"use client";

import { Heart } from "lucide-react";
import { ListSection } from "./ListSection";

/** Gratitude list for the daily reflection (Sprint 2.10). */
export function GratitudeSection({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <ListSection
      label="Gratitude"
      icon={<Heart size={14} aria-hidden className="text-danger" />}
      placeholder="Something you're grateful for…"
      items={items}
      onChange={onChange}
    />
  );
}
