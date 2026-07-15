import type { GoalType, HabitFrequency } from "./constants";

/**
 * Goal quick-capture parser (Sprint 2.12). Deterministic extraction of a goal
 * type (#type), an optional habit frequency and a target date from a short
 * capture. No AI.
 */
export interface ParsedGoal {
  title: string;
  goalType: GoalType;
  habitFrequency: HabitFrequency | null;
  targetDate: string | null;
}

const TYPE_WORDS: Record<string, GoalType> = {
  career: "career",
  job: "career",
  work: "career",
  education: "education",
  study: "education",
  learn: "education",
  degree: "education",
  health: "health",
  fitness: "health",
  gym: "health",
  finance: "finance",
  money: "finance",
  savings: "finance",
  personal: "personal",
  life: "life",
};

const FREQ_WORDS: Record<string, HabitFrequency> = {
  daily: "daily",
  "every day": "daily",
  weekly: "weekly",
  "every week": "weekly",
  monthly: "monthly",
};

export function parseGoal(input: string): ParsedGoal {
  const text = input.trim();
  const lower = text.toLowerCase();

  let goalType: GoalType = "personal";
  const tagMatch = lower.match(/#(\w+)/);
  if (tagMatch && (TYPE_WORDS[tagMatch[1]!] as GoalType | undefined)) {
    goalType = TYPE_WORDS[tagMatch[1]!]!;
  } else {
    for (const [word, type] of Object.entries(TYPE_WORDS)) {
      if (lower.includes(word)) {
        goalType = type;
        break;
      }
    }
  }

  let habitFrequency: HabitFrequency | null = null;
  for (const [word, freq] of Object.entries(FREQ_WORDS)) {
    if (lower.includes(word)) {
      habitFrequency = freq;
      break;
    }
  }

  // Target date: an explicit YYYY-MM-DD, or "by <year>".
  let targetDate: string | null = null;
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) targetDate = isoMatch[1]!;
  else {
    const yearMatch = lower.match(/\bby\s+(\d{4})\b/);
    if (yearMatch) targetDate = `${yearMatch[1]}-12-31`;
  }

  const title = text.replace(/#\w+/g, "").replace(/\s+/g, " ").trim() || "Untitled goal";
  return { title, goalType, habitFrequency, targetDate };
}
