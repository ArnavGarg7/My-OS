import { describe, expect, it } from "vitest";
import { computeReadiness } from "./readiness";
import { makeReadinessInput } from "./fixtures";

describe("computeReadiness", () => {
  it("computes density, focus opportunity + intensity", () => {
    const r = computeReadiness(
      makeReadinessInput({ meetingMinutes: 150, expectedWorkloadMinutes: 180 }),
    );
    expect(r.meetingDensity).toBe(31); // 150/480
    expect(r.focusOpportunityMinutes).toBe(150); // 480 - 150 - 180
    expect(r.intensity).toBe("moderate"); // 330 total
    expect(r.score).toBeGreaterThan(0);
  });
  it("recommends lowering intensity on low readiness", () => {
    const r = computeReadiness(
      makeReadinessInput({
        healthReadiness: 45,
        meetingMinutes: 240,
        expectedWorkloadMinutes: 240,
      }),
    );
    expect(r.score).toBeLessThanOrEqual(60);
    expect(r.recoveryRecommendation).toMatch(/lower/i);
  });
  it("suggests front-loading on a heavy day", () => {
    const r = computeReadiness(
      makeReadinessInput({ healthReadiness: 90, meetingMinutes: 60, expectedWorkloadMinutes: 360 }),
    );
    expect(r.intensity).toBe("heavy");
    expect(r.recoveryRecommendation).toMatch(/front-load/i);
  });
  it("defaults the sleep target", () => {
    const r = computeReadiness({
      expectedWorkloadMinutes: 120,
      meetingMinutes: 60,
      healthReadiness: 80,
    });
    expect(r.sleepTargetMinutes).toBe(450);
  });
  it("honours a custom sleep target", () => {
    expect(
      computeReadiness(makeReadinessInput({ sleepTargetMinutes: 480 })).sleepTargetMinutes,
    ).toBe(480);
  });
  it("is a light day with little committed time", () => {
    const r = computeReadiness(
      makeReadinessInput({ meetingMinutes: 30, expectedWorkloadMinutes: 60, healthReadiness: 90 }),
    );
    expect(r.intensity).toBe("light");
    expect(r.recoveryRecommendation).toMatch(/protect your focus/i);
  });
  it("floors focus opportunity at zero when overbooked", () => {
    const r = computeReadiness(
      makeReadinessInput({ meetingMinutes: 400, expectedWorkloadMinutes: 200 }),
    );
    expect(r.focusOpportunityMinutes).toBe(0);
  });
  it("caps meeting density at 100", () => {
    const r = computeReadiness(makeReadinessInput({ meetingMinutes: 600 }));
    expect(r.meetingDensity).toBe(100);
  });
});
