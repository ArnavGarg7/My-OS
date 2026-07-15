import { SESSION_TYPES, type InterruptionType, type SessionType } from "./constants";
import type { StartSessionInput } from "./types";

/**
 * Deterministic focus command parser (Sprint 3.2). Turns short natural phrases into
 * a StartSessionInput. Whole-word matching only (so "preview" never trips "review").
 * No AI, no fuzzy guessing — unknown input falls back to a default focus session.
 */
const TYPE_ALIASES: Record<string, SessionType> = {
  focus: "focus",
  deep: "deep_work",
  "deep work": "deep_work",
  deepwork: "deep_work",
  shallow: "shallow_work",
  "shallow work": "shallow_work",
  admin: "shallow_work",
  review: "review",
  plan: "planning",
  planning: "planning",
  meeting: "meeting",
  break: "break",
  recovery: "recovery",
};

const INTERRUPTION_ALIASES: Record<string, InterruptionType> = {
  phone: "phone",
  call: "phone",
  meeting: "meeting",
  message: "message",
  msg: "message",
  slack: "message",
  chat: "message",
  distraction: "distraction",
  distracted: "distraction",
  other: "other",
};

function tokens(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function matchType(input: string, words: string[]): SessionType | null {
  const lower = input.toLowerCase();
  // Multi-word aliases first (whole phrase).
  for (const [alias, type] of Object.entries(TYPE_ALIASES)) {
    if (alias.includes(" ") && lower.includes(alias)) return type;
  }
  for (const word of words) {
    const t = TYPE_ALIASES[word];
    if (t) return t;
  }
  return null;
}

function matchMinutes(words: string[]): number | null {
  for (const word of words) {
    const n = Number.parseInt(word, 10);
    if (!Number.isNaN(n) && n > 0 && n <= 600) return n;
  }
  return null;
}

export interface ParsedFocusCommand {
  input: StartSessionInput;
  matchedType: boolean;
  matchedMinutes: boolean;
}

export function parseFocusCommand(raw: string): ParsedFocusCommand {
  const words = tokens(raw);
  const type = matchType(raw, words);
  const minutes = matchMinutes(words);

  const input: StartSessionInput = {
    type: type ?? "focus",
    ...(minutes !== null ? { plannedMinutes: minutes } : {}),
  };

  return {
    input,
    matchedType: type !== null,
    matchedMinutes: minutes !== null,
  };
}

/** Parse an interruption phrase into a type (defaults to "other"). */
export function parseInterruption(raw: string): InterruptionType {
  for (const word of tokens(raw)) {
    const t = INTERRUPTION_ALIASES[word];
    if (t) return t;
  }
  return "other";
}

/** Whether a string names a valid session type. */
export function isSessionType(value: string): value is SessionType {
  return (SESSION_TYPES as readonly string[]).includes(value);
}
