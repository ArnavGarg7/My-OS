import { describe, expect, it } from "vitest";
import { z } from "zod";
import { isRegression, runSuite, type EvalFixture } from "./index";
import { validateStructured } from "../structured";

const schema = z.object({ ok: z.boolean() });

const fixtures: EvalFixture<string, string>[] = [
  {
    name: "valid json",
    input: '{"ok":true}',
    assert: (out) => ({ pass: validateStructured(out, schema).ok, detail: out }),
  },
  {
    name: "invalid json",
    input: "garbage",
    assert: (out) => ({ pass: !validateStructured(out, schema).ok, detail: out }),
  },
];

describe("evals framework", () => {
  it("runs a suite and tallies pass/fail", async () => {
    const result = await runSuite("structured", fixtures, (input) => input);
    expect(result.total).toBe(2);
    expect(result.passed).toBe(2);
    expect(result.failed).toBe(0);
  });

  it("records failing assertions without throwing", async () => {
    const bad: EvalFixture<number, number>[] = [
      { name: "always fails", input: 1, assert: () => ({ pass: false, detail: "nope" }) },
    ];
    const result = await runSuite("x", bad, (i) => i);
    expect(result.failed).toBe(1);
    expect(result.cases[0]!.pass).toBe(false);
  });

  it("detects regressions", () => {
    const base = { suite: "s", total: 2, passed: 2, failed: 0, cases: [] };
    const worse = { suite: "s", total: 2, passed: 1, failed: 1, cases: [] };
    expect(isRegression(base, worse)).toBe(true);
    expect(isRegression(base, base)).toBe(false);
  });
});
