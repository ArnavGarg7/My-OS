/**
 * Signal Generator (Sprint 6.1). Deterministically maps a normalized DomainEvent to zero-or-one
 * immutable Signal via a rule table keyed by event kind. No AI, no clock — `createdAt` comes from
 * the event, ids from an injected factory. Unknown event kinds produce no signal (silence is valid).
 */
import type {
  ContextWindow,
  DomainEvent,
  Signal,
  SignalCategory,
  SignalExplanation,
  SignalSeverity,
} from "./types";
import { WINDOW_EXPIRY_HOURS } from "./constants";

export interface GeneratorDeps {
  /** Deterministic id factory (injected — no randomness in core). */
  newId: () => string;
}

/** A rule: given an event, produce the signal's shape (or null to ignore). */
interface Rule {
  category: SignalCategory;
  severity: SignalSeverity;
  window: ContextWindow;
  confidence: number;
  explain: (e: DomainEvent) => SignalExplanation;
  /** What the signal is "about" (for the dedupe key). */
  subject: (e: DomainEvent) => string;
}

const num = (v: unknown, d = 0): number => (typeof v === "number" ? v : d);
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);

/** The event→signal rule table (spec §Signal Engine + §Opportunity/§Risk examples). */
const RULES: Record<string, Rule> = {
  "task.completed": {
    category: "productivity",
    severity: "info",
    window: "today",
    confidence: 0.9,
    subject: (e) => `progress:${str(e.ref?.module, "task")}`,
    explain: (e) => ({
      headline: "Sprint progress increasing",
      reasons: [
        `Completed "${str(e.ref?.label, "a task")}"`,
        `${num(e.payload.completedToday)} done today`,
      ],
      implication: "You're ahead of pace — consider pulling forward the next priority.",
    }),
  },
  "calendar.meeting_cancelled": {
    category: "opportunities",
    severity: "medium",
    window: "today",
    confidence: 0.85,
    subject: (e) => `free_window:${str(e.payload.startsAt)}`,
    explain: (e) => ({
      headline: "Free focus window detected",
      reasons: [
        `"${str(e.ref?.label, "A meeting")}" was cancelled`,
        `${num(e.payload.minutes)} minutes freed`,
      ],
      implication: "A protected deep-work block just opened up.",
    }),
  },
  "health.readiness_dropped": {
    category: "health",
    severity: "high",
    window: "current",
    confidence: 0.8,
    subject: () => "readiness",
    explain: (e) => ({
      headline: "Low readiness",
      reasons: [`Readiness fell to ${num(e.payload.readiness)}`, "Below your recovery baseline"],
      implication: "Burnout risk — favour lighter work and protect sleep.",
    }),
  },
  "knowledge.study_completed": {
    category: "learning",
    severity: "info",
    window: "today",
    confidence: 0.85,
    subject: (e) => `study:${str(e.ref?.id)}`,
    explain: (e) => ({
      headline: "Study session finished",
      reasons: [
        `Studied "${str(e.ref?.label, "material")}"`,
        `${num(e.payload.minutes)} minutes focused`,
      ],
      implication: "Momentum is high — a short review now aids retention.",
    }),
  },
  "task.deadline_at_risk": {
    category: "risks",
    severity: "high",
    window: "week",
    confidence: 0.75,
    subject: (e) => `deadline:${str(e.ref?.id)}`,
    explain: (e) => ({
      headline: "Deadline risk",
      reasons: [
        "No recent progress",
        `${num(e.payload.daysRemaining)} days remaining`,
        `Estimated work (${num(e.payload.estimateHours)}h) exceeds available time`,
      ],
      implication: "This will slip unless scheduled deliberately.",
    }),
  },
  "planner.schedule_slipping": {
    category: "planning",
    severity: "medium",
    window: "today",
    confidence: 0.7,
    subject: () => "schedule",
    explain: (e) => ({
      headline: "Schedule slipping",
      reasons: [`${num(e.payload.missed)} planned items unfinished`, "Today's plan is behind"],
      implication: "A re-plan would recover the remaining blocks.",
    }),
  },
  "goal.milestone_reached": {
    category: "projects",
    severity: "info",
    window: "long_term",
    confidence: 0.9,
    subject: (e) => `milestone:${str(e.ref?.id)}`,
    explain: (e) => ({
      headline: "Milestone reached",
      reasons: [`"${str(e.ref?.label, "A milestone")}" is complete`],
      implication: "Good moment to review the next objective.",
    }),
  },
  "finance.budget_exceeded": {
    category: "finance",
    severity: "high",
    window: "week",
    confidence: 0.85,
    subject: (e) => `budget:${str(e.payload.category)}`,
    explain: (e) => ({
      headline: "Budget exceeded",
      reasons: [`"${str(e.payload.category, "A budget")}" over by ${num(e.payload.overBy)}`],
      implication: "Spending needs attention this cycle.",
    }),
  },
  "resource.renewal_due": {
    category: "resources",
    severity: "medium",
    window: "week",
    confidence: 0.8,
    subject: (e) => `renewal:${str(e.ref?.id)}`,
    explain: (e) => ({
      headline: "Renewal approaching",
      reasons: [`"${str(e.ref?.label, "An item")}" renews in ${num(e.payload.daysRemaining)} days`],
      implication: "Act before it lapses or auto-charges.",
    }),
  },

  // ── External connector events (Sprint 6.4). Normalized events from the Connector Platform flow
  //    through the IDENTICAL pipeline — the sources expand, the intelligence is unchanged.
  "github.ci_failed": {
    category: "risks",
    severity: "high",
    window: "current",
    confidence: 0.85,
    subject: (e) => `ci:${str(e.ref?.id)}`,
    explain: (e) => ({
      headline: "CI is failing",
      reasons: [`"${str(e.ref?.label, "A pipeline")}" failed`, "Blocks merges and deploys"],
      implication: "Fix the build before continuing dependent work.",
    }),
  },
  "github.review_requested": {
    category: "productivity",
    severity: "low",
    window: "today",
    confidence: 0.8,
    subject: (e) => `review:${str(e.ref?.id)}`,
    explain: (e) => ({
      headline: "Review requested",
      reasons: [`You were asked to review "${str(e.ref?.label, "a PR")}"`],
      implication: "A short review now unblocks a teammate.",
    }),
  },
  "gmail.important_email": {
    category: "productivity",
    severity: "medium",
    window: "today",
    confidence: 0.7,
    subject: (e) => `email:${str(e.ref?.id)}`,
    explain: (e) => ({
      headline: "Important email",
      reasons: [`"${str(e.ref?.label, "A message")}" flagged important`],
      implication: "Worth a look before it gets buried.",
    }),
  },
  "weather.rain_forecast": {
    category: "environment",
    severity: "low",
    window: "tomorrow",
    confidence: 0.75,
    subject: () => "weather:rain",
    explain: (e) => ({
      headline: "Rain forecast",
      reasons: [`Rain expected ${str(e.payload.when, "soon")}`],
      implication: "Plan commutes and outdoor blocks around it.",
    }),
  },
  "slack.mention": {
    category: "productivity",
    severity: "low",
    window: "current",
    confidence: 0.7,
    subject: (e) => `mention:${str(e.ref?.id)}`,
    explain: (e) => ({
      headline: "You were mentioned",
      reasons: [`Mention in "${str(e.ref?.label, "a channel")}"`],
      implication: "Someone is waiting on your input.",
    }),
  },
};

/** Generate a signal from an event, or null if no rule matches. Deterministic. */
export function generateSignal(event: DomainEvent, deps: GeneratorDeps): Signal | null {
  const rule = RULES[event.kind];
  if (!rule) return null;
  const expiryHours = WINDOW_EXPIRY_HOURS[rule.window];
  const expiresAt =
    expiryHours === null
      ? null
      : new Date(new Date(event.at).getTime() + expiryHours * 3_600_000).toISOString();
  return {
    id: deps.newId(),
    source: event.source,
    category: rule.category,
    severity: rule.severity,
    confidence: rule.confidence,
    createdAt: event.at,
    expiresAt,
    window: rule.window,
    explanation: rule.explain(event),
    relatedObjects: event.ref ? [event.ref] : [],
    eventIds: [event.id],
    status: "active",
    dedupeKey: `${event.source}:${rule.category}:${rule.subject(event)}`,
  };
}

/** Generate signals for a batch of events (nulls dropped). */
export function generateSignals(events: readonly DomainEvent[], deps: GeneratorDeps): Signal[] {
  const out: Signal[] = [];
  for (const e of events) {
    const s = generateSignal(e, deps);
    if (s) out.push(s);
  }
  return out;
}

/** The set of event kinds the generator recognises (for watchers/tests). */
export const KNOWN_EVENT_KINDS = Object.keys(RULES);
