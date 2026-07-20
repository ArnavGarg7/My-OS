/**
 * Reasoning / grounding (Sprint 5.3). Composes the assistant's answer text from the intent + the
 * TOOL RESULTS — never from thin air. If the tools returned nothing, the Chief says so plainly
 * ("the operating system doesn't have that information") rather than hallucinating. The FACTS come
 * from deterministic tools; a real provider may rephrase, but the grounding is fixed. Pure.
 */
import type { IntentPlan } from "./context-router";
import type { ToolLoopResult } from "./tool-loop";

export interface ReasonedAnswer {
  text: string;
  unknown: boolean;
}

/** Compose a grounded answer. Deterministic given the plan + tool results. */
export function composeAnswer(
  message: string,
  plan: IntentPlan,
  loop: ToolLoopResult,
): ReasonedAnswer {
  // Recommendation / explanation from the chief_now tool result.
  const chief = loop.results.find((r) => r.name === "chief_now" && r.ok)?.value as
    | {
        recommendation?: {
          title?: string;
          explanation?: { recommendation?: string; costOfIgnoring?: string; situation?: string };
        };
      }
    | undefined;

  if (plan.intent === "recommend" && chief?.recommendation) {
    const rec = chief.recommendation;
    return {
      text: `Right now: ${rec.title}. ${rec.explanation?.recommendation ?? ""}`.trim(),
      unknown: false,
    };
  }
  if (plan.intent === "explain" && chief?.recommendation?.explanation) {
    const e = chief.recommendation.explanation;
    return {
      text: `${e.situation ?? ""} ${e.recommendation ?? ""} Cost of ignoring: ${e.costOfIgnoring ?? "—"}`.trim(),
      unknown: false,
    };
  }
  if (plan.intent === "mutate") {
    return {
      text: "I've prepared a proposal for that change — review it below and accept to apply.",
      unknown: false,
    };
  }

  // Lookups / answers: ground in whatever the tools returned.
  if (!loop.grounded) {
    return {
      text: "The operating system doesn't have a record of that. I only answer from your real data, so I won't guess.",
      unknown: true,
    };
  }
  const counts = loop.results
    .filter((r) => r.ok)
    .map((r) => (Array.isArray(r.value) ? `${r.value.length} from ${r.name}` : r.name))
    .join(", ");
  return { text: `Here's what I found: ${counts}. See the cited sources below.`, unknown: false };
}
