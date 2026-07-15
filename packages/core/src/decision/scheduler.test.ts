import { describe, expect, it } from "vitest";
import {
  computeDeferUntil,
  cooldownUntil,
  isDue,
  isExpired,
  isInCooldown,
  minutesUntil,
} from "./scheduler";
import { DISMISS_COOLDOWN_MS } from "./constants";
import { at, makeDecision } from "./fixtures";

describe("computeDeferUntil", () => {
  it("defers by fixed minutes", () => {
    expect(computeDeferUntil("15m", at(10)).getTime()).toBe(at(10, 15).getTime());
    expect(computeDeferUntil("30m", at(10)).getTime()).toBe(at(10, 30).getTime());
    expect(computeDeferUntil("1h", at(10)).getTime()).toBe(at(11).getTime());
  });
  it("defers to tomorrow morning", () => {
    const d = computeDeferUntil("tomorrow", at(10));
    expect(d.getDate()).toBe(8);
    expect(d.getHours()).toBe(6);
  });
  it("uses a custom datetime", () => {
    const custom = at(16, 30);
    expect(computeDeferUntil("custom", at(10), custom).getTime()).toBe(custom.getTime());
  });
});

describe("minutesUntil", () => {
  it("computes forward + backward minutes", () => {
    expect(minutesUntil(at(11).toISOString(), at(10))).toBe(60);
    expect(minutesUntil(at(9).toISOString(), at(10))).toBe(-60);
    expect(minutesUntil(null, at(10))).toBeNull();
  });
});

describe("isDue / isExpired", () => {
  it("isDue is true for null or past deferrals", () => {
    expect(isDue(null, at(10))).toBe(true);
    expect(isDue(at(9).toISOString(), at(10))).toBe(true);
    expect(isDue(at(11).toISOString(), at(10))).toBe(false);
  });
  it("isExpired is true only past expiry", () => {
    expect(isExpired(null, at(10))).toBe(false);
    expect(isExpired(at(9).toISOString(), at(10))).toBe(true);
    expect(isExpired(at(11).toISOString(), at(10))).toBe(false);
  });
});

describe("cooldown", () => {
  it("cooldownUntil is now + the cooldown window", () => {
    expect(cooldownUntil(at(10)).getTime()).toBe(at(10).getTime() + DISMISS_COOLDOWN_MS);
  });
  it("isInCooldown reads metadata.cooldownUntil", () => {
    expect(
      isInCooldown(makeDecision({ metadata: { cooldownUntil: at(12).toISOString() } }), at(10)),
    ).toBe(true);
    expect(
      isInCooldown(makeDecision({ metadata: { cooldownUntil: at(9).toISOString() } }), at(10)),
    ).toBe(false);
    expect(isInCooldown(makeDecision(), at(10))).toBe(false);
  });
});
