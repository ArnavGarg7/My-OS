"use client";

import { GraduationCap } from "lucide-react";
import { ListSection } from "./ListSection";

/** Lessons list for the daily reflection (Sprint 2.10). */
export function LessonsSection({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <ListSection
      label="Lessons"
      icon={<GraduationCap size={14} aria-hidden className="text-fg-subtle" />}
      placeholder="Something you learned…"
      items={items}
      onChange={onChange}
    />
  );
}
