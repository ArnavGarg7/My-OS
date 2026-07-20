/**
 * Evaluation Framework (Sprint 5.1, 06_AI_Architecture §Evaluation Framework). A CI-runnable harness:
 * each suite is a set of fixtures (input → assertion). A runner produces an output; the fixture
 * asserts structurally (schema-valid / property checks), never string-exact. Deterministic and pure
 * — suites run against the Local provider so they're stable release-to-release, and the server can
 * persist run summaries to `ai_eval_runs`.
 */

export interface EvalFixture<I, O> {
  name: string;
  input: I;
  /** Structural assertion over the produced output. */
  assert: (output: O) => { pass: boolean; detail: string };
}

export interface EvalCaseResult {
  name: string;
  pass: boolean;
  detail: string;
}

export interface EvalRunResult {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  cases: EvalCaseResult[];
}

/** Run a suite: apply `run` to each fixture's input, then its assertion. Never throws. */
export async function runSuite<I, O>(
  suite: string,
  fixtures: readonly EvalFixture<I, O>[],
  run: (input: I) => Promise<O> | O,
): Promise<EvalRunResult> {
  const cases: EvalCaseResult[] = [];
  for (const f of fixtures) {
    try {
      const output = await run(f.input);
      const verdict = f.assert(output);
      cases.push({ name: f.name, pass: verdict.pass, detail: verdict.detail });
    } catch (err) {
      cases.push({
        name: f.name,
        pass: false,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }
  const passed = cases.filter((c) => c.pass).length;
  return { suite, total: cases.length, passed, failed: cases.length - passed, cases };
}

/** Regression check: current run must not have fewer passes than the baseline. */
export function isRegression(baseline: EvalRunResult, current: EvalRunResult): boolean {
  return current.passed < baseline.passed;
}

export {
  E2E_SCENARIOS,
  evaluateScenario,
  type E2EScenario,
  type E2EOutcome,
  type E2EResult,
  type E2ECheck,
} from "./scenarios";
