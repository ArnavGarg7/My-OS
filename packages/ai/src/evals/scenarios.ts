/**
 * End-to-End AI Validation scenarios (Sprint 5.4, 06_AI_Architecture §E2E). A canonical set of
 * natural-language requests, each with the deterministic expectations a correct run must satisfy:
 * which tools it calls, which provider serves it, whether it proposes a mutation, whether it cites
 * sources, and whether telemetry was emitted. Pure — the server executes each scenario through the
 * real assistant pipeline and scores the actual outcome here.
 */

/** A scenario's expectations. */
export interface E2EScenario {
  name: string;
  message: string;
  /** Tools a correct run must call (subset match — the run may call more). */
  expectedTools: string[];
  /** Expected serving provider (Local in offline/CI). */
  expectedProvider: string;
  /** Whether the request should produce a proposal (mutation). */
  expectProposal: boolean;
  /** Whether the answer must cite ≥1 source. */
  expectCitations: boolean;
}

/** The actual outcome measured from a real run. */
export interface E2EOutcome {
  toolsCalled: string[];
  provider: string;
  hadProposal: boolean;
  citationCount: number;
  telemetryEmitted: boolean;
  grounded: boolean;
}

export interface E2ECheck {
  label: string;
  pass: boolean;
}

export interface E2EResult {
  name: string;
  pass: boolean;
  checks: E2ECheck[];
}

/** The built-in E2E validation set (mirrors the sprint's examples). */
export const E2E_SCENARIOS: readonly E2EScenario[] = [
  {
    name: "what should I do now",
    message: "What should I do now?",
    expectedTools: ["chief_now"],
    expectedProvider: "local",
    expectProposal: false,
    expectCitations: true,
  },
  {
    name: "move gym to friday",
    message: "Move gym to Friday.",
    expectedTools: [],
    expectedProvider: "local",
    expectProposal: true,
    expectCitations: false,
  },
  {
    name: "explain recommendation",
    message: "Explain today's recommendation.",
    expectedTools: ["chief_now"],
    expectedProvider: "local",
    expectProposal: false,
    expectCitations: true,
  },
  {
    name: "summarize yesterday",
    message: "Summarize yesterday.",
    expectedTools: ["query_tasks"],
    expectedProvider: "local",
    expectProposal: false,
    expectCitations: true,
  },
  {
    name: "review pending decisions",
    message: "Review pending decisions.",
    expectedTools: ["chief_now"],
    expectedProvider: "local",
    expectProposal: false,
    expectCitations: true,
  },
] as const;

/** Score an actual outcome against a scenario's expectations. Deterministic. */
export function evaluateScenario(scenario: E2EScenario, outcome: E2EOutcome): E2EResult {
  const calledAll = scenario.expectedTools.every((t) => outcome.toolsCalled.includes(t));
  const checks: E2ECheck[] = [
    { label: "correct tools", pass: calledAll },
    { label: "correct provider", pass: outcome.provider === scenario.expectedProvider },
    { label: "correct proposal", pass: outcome.hadProposal === scenario.expectProposal },
    {
      label: "correct citations",
      pass: scenario.expectCitations ? outcome.citationCount > 0 : true,
    },
    { label: "telemetry emitted", pass: outcome.telemetryEmitted },
  ];
  return { name: scenario.name, pass: checks.every((c) => c.pass), checks };
}
