import {
  BookOpen,
  Heart,
  Lightbulb,
  NotebookPen,
  ScrollText,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { EntryType, MoodLevel } from "@myos/core/journal";

/** Presentational icon + tone maps for the Journal UI (Sprint 2.10). */
export const ENTRY_ICON: Record<EntryType, LucideIcon> = {
  daily: NotebookPen,
  reflection: ScrollText,
  gratitude: Heart,
  review: BookOpen,
  idea: Lightbulb,
};

export const ENTRY_LABEL: Record<EntryType, string> = {
  daily: "Daily",
  reflection: "Reflection",
  gratitude: "Gratitude",
  review: "Review",
  idea: "Idea",
};

export const MOOD_LABEL: Record<MoodLevel, string> = {
  very_low: "Very low",
  low: "Low",
  neutral: "Neutral",
  good: "Good",
  excellent: "Excellent",
};

export const MOOD_EMOJI: Record<MoodLevel, string> = {
  very_low: "😞",
  low: "🙁",
  neutral: "😐",
  good: "🙂",
  excellent: "😄",
};

export const MOOD_TONE: Record<MoodLevel, string> = {
  very_low: "text-danger",
  low: "text-warning",
  neutral: "text-fg-subtle",
  good: "text-success",
  excellent: "text-success",
};

export const JOURNAL_ICONS = { streak: Sparkles, win: Trophy, gratitude: Heart };
