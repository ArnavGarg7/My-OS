import type { PromptContext } from "./constants";
import type { Prompt } from "./types";

/**
 * Prompt engine (Sprint 2.10). Deterministic, rule-based reflection prompts by
 * context (morning / evening / weekly / monthly). No LLM.
 */
const PROMPTS: Record<PromptContext, string[]> = {
  morning: [
    "What is today's intention?",
    "What matters most today?",
    "What would make today great?",
  ],
  evening: [
    "What went well today?",
    "What did you learn today?",
    "What are you grateful for today?",
  ],
  weekly: [
    "What progress are you proud of this week?",
    "What drained your energy this week?",
    "What will you do differently next week?",
  ],
  monthly: [
    "What changed this month?",
    "What did you accomplish this month?",
    "What habit do you want to build next month?",
  ],
  any: ["What's on your mind?", "Write freely for five minutes."],
};

export function promptsFor(context: PromptContext): Prompt[] {
  return PROMPTS[context].map((text, i) => ({ id: `${context}-${i}`, context, text }));
}

/** Pick a context from the local hour (deterministic, no randomness). */
export function contextForHour(hour: number): PromptContext {
  if (hour < 11) return "morning";
  if (hour >= 18) return "evening";
  return "any";
}

/** The single headline prompt for a context (first in its list). */
export function headlinePrompt(context: PromptContext): Prompt {
  return promptsFor(context)[0]!;
}
