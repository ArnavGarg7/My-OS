import "server-only";
import { contextForHour, promptsFor, type Prompt, type PromptContext } from "@myos/core/journal";

/**
 * Journal prompt provider (Sprint 2.10). Deterministic, rule-based prompts. When
 * no context is supplied, one is chosen from the local hour. No LLM.
 */
export function prompts(tz: string, context?: PromptContext): Prompt[] {
  const ctx =
    context ??
    contextForHour(
      Number(
        new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(
          new Date(),
        ),
      ) % 24,
    );
  return promptsFor(ctx);
}
