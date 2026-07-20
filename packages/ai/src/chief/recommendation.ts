/**
 * Now Engine (Sprint 5.2) — the heart of My OS. Continuously answers "what should I do right now?"
 * DETERMINISTICALLY from the context: it ranks the deterministic candidates (active block, top
 * scored task, break rules, disruptions, pending decisions) and selects one, attaching confidence
 * and a grounded explanation. It computes no business logic — the scores, windows and readiness all
 * arrive pre-computed. A provider may rephrase the copy; the choice itself is reproducible.
 */
import { confidenceFor } from "./confidence";
import { buildExplanation, situationSentence } from "./explanation";
import { bestFocusWindow, breakDue, minutesBetween } from "./signals";
import type { Alternative, ChiefContext, Recommendation } from "./types";

/** The active plan block covering `now`, if any. */
function activeBlock(ctx: ChiefContext) {
  const t = new Date(ctx.now).getTime();
  return (
    ctx.planBlocks.find((b) => b.status === "active") ??
    ctx.planBlocks.find(
      (b) =>
        new Date(b.start).getTime() <= t && t < new Date(b.end).getTime() && b.status === "planned",
    ) ??
    null
  );
}

/** Up to two alternative tasks (beyond the primary) as start-focus alternatives. */
function taskAlternatives(ctx: ChiefContext, excludeTaskId?: string): Alternative[] {
  return ctx.tasks
    .filter((t) => t.id !== excludeTaskId && t.status !== "done")
    .slice(0, 2)
    .map((t) => ({
      title: `Work on "${t.title}"`,
      action: "start_focus" as const,
      ref: { module: "task", id: t.id },
    }));
}

/**
 * Produce the current recommendation. Deterministic priority ladder — the first matching rule wins,
 * so the same context always yields the same recommendation.
 */
export function nowRecommendation(ctx: ChiefContext): Recommendation {
  const confidence = confidenceFor(ctx);
  const situation = situationSentence(ctx);
  const window = bestFocusWindow(ctx);
  const topTask = ctx.tasks.find((t) => t.status !== "done") ?? null;

  // 1. Active focus session → break if due, else keep going.
  if (ctx.activeFocusSession) {
    const elapsed = minutesBetween(ctx.activeFocusSession.startedAt, ctx.now);
    if (breakDue(ctx)) {
      return {
        action: "take_break",
        title: "Take a break",
        estimateMinutes: 10,
        confidence,
        explanation: buildExplanation({
          situation: `You've focused for ${elapsed} minutes.`,
          recommendation: "Take a short break to sustain focus.",
          alternatives: [{ title: "Keep going", action: "start_focus" }],
          costOfIgnoring: "Pushing past your break cadence lowers the quality of the next block.",
          confidence,
        }),
        alternatives: [{ title: "Keep going", action: "start_focus" }],
      };
    }
    return {
      action: "start_focus",
      title: "Stay focused",
      estimateMinutes: Math.max(0, ctx.activeFocusSession.plannedMinutes - elapsed),
      confidence,
      explanation: buildExplanation({
        situation: `You're ${elapsed} minutes into a focus session.`,
        recommendation: "Keep going — you're in the middle of deep work.",
        alternatives: [{ title: "Take a break", action: "take_break" }],
        costOfIgnoring: "Switching now breaks your momentum.",
        confidence,
      }),
      alternatives: [{ title: "Take a break", action: "take_break" }],
    };
  }

  // 2. Disruptions → recommend a rescue.
  if (ctx.disruptions.length > 0) {
    return {
      action: "reschedule",
      title: "Rescue your day",
      estimateMinutes: null,
      confidence,
      explanation: buildExplanation({
        situation: `Your plan was disrupted: ${ctx.disruptions[0]!.detail}.`,
        recommendation: "Let me reshuffle the rest of your day around what's changed.",
        alternatives: taskAlternatives(ctx),
        costOfIgnoring: "Following a stale plan wastes the time you have left.",
        confidence,
      }),
      alternatives: taskAlternatives(ctx),
    };
  }

  // 3. Active block → do it.
  const block = activeBlock(ctx);
  if (block) {
    return {
      action: "start_block",
      title: block.title,
      ref: { module: "planner", id: block.id },
      estimateMinutes: minutesBetween(ctx.now, block.end),
      confidence,
      explanation: buildExplanation({
        situation,
        recommendation: `"${block.title}" is on your plan right now.`,
        alternatives: taskAlternatives(ctx, block.taskId ?? undefined),
        costOfIgnoring: "Skipping the block pushes everything after it later.",
        confidence,
      }),
      alternatives: taskAlternatives(ctx, block.taskId ?? undefined),
    };
  }

  // 4. Uninterrupted window + top task → deep focus.
  if (window?.uninterrupted && window.minutes >= ctx.profile.deepWorkMinBlockMinutes && topTask) {
    return {
      action: "start_focus",
      title: `Focus on "${topTask.title}"`,
      ref: { module: "task", id: topTask.id },
      estimateMinutes: topTask.estimateMin ?? Math.min(window.minutes, 120),
      confidence,
      explanation: buildExplanation({
        situation,
        recommendation: `Start "${topTask.title}" — it's your highest-priority task and you have the time.`,
        alternatives: taskAlternatives(ctx, topTask.id),
        costOfIgnoring: topTask.dueAt
          ? "It's due soon; delaying risks the deadline."
          : "Momentum on your top task fades if you wait.",
        confidence,
      }),
      alternatives: taskAlternatives(ctx, topTask.id),
    };
  }

  // 5. Some free time + a task → do the top task.
  if (window && window.minutes >= 15 && topTask) {
    return {
      action: "start_block",
      title: `Work on "${topTask.title}"`,
      ref: { module: "task", id: topTask.id },
      estimateMinutes: Math.min(window.minutes, topTask.estimateMin ?? 30),
      confidence,
      explanation: buildExplanation({
        situation,
        recommendation: `Use the ${window.minutes} free minutes on "${topTask.title}".`,
        alternatives: taskAlternatives(ctx, topTask.id),
        costOfIgnoring: "Small windows add up — spending them advances your priorities.",
        confidence,
      }),
      alternatives: taskAlternatives(ctx, topTask.id),
    };
  }

  // 6. Pending decisions → review.
  if (ctx.pendingDecisions > 0) {
    return {
      action: "review",
      title: "Review pending decisions",
      estimateMinutes: 5,
      confidence,
      explanation: buildExplanation({
        situation: `${ctx.pendingDecisions} decision${ctx.pendingDecisions === 1 ? "" : "s"} are waiting.`,
        recommendation: "Clear your pending decisions so nothing stalls.",
        alternatives: taskAlternatives(ctx),
        costOfIgnoring: "Unmade decisions quietly block the work behind them.",
        confidence,
      }),
      alternatives: taskAlternatives(ctx),
    };
  }

  // 7. No plan → plan the day.
  if (ctx.planBlocks.length === 0) {
    return {
      action: "plan",
      title: "Plan your day",
      estimateMinutes: 5,
      confidence,
      explanation: buildExplanation({
        situation: "You don't have a plan for today yet.",
        recommendation: "Let me draft a plan from your tasks and calendar.",
        alternatives: taskAlternatives(ctx),
        costOfIgnoring: "Without a plan the day drifts to whatever's loudest.",
        confidence,
      }),
      alternatives: taskAlternatives(ctx),
    };
  }

  // 8. Idle.
  return {
    action: "idle",
    title: "You're on track",
    estimateMinutes: null,
    confidence,
    explanation: buildExplanation({
      situation: "Nothing is due and no block is active.",
      recommendation: "Rest or get ahead on a lower-priority task.",
      alternatives: taskAlternatives(ctx),
      costOfIgnoring: "Nothing — you're caught up.",
      confidence,
    }),
    alternatives: taskAlternatives(ctx),
  };
}
