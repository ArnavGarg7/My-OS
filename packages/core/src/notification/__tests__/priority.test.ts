import { describe, expect, it } from "vitest";
import {
  comparePriority,
  escalate,
  isHigherPriority,
  resolveEscalation,
  topPriority,
} from "../priority";
import { escalationForPriority } from "../constants";
import { makeNotification } from "../fixtures";

describe("priority + escalation", () => {
  it("compares priorities (higher first)", () => {
    expect(comparePriority("critical", "low")).toBeLessThan(0);
    expect(comparePriority("low", "critical")).toBeGreaterThan(0);
    expect(comparePriority("medium", "medium")).toBe(0);
  });

  it("isHigherPriority", () => {
    expect(isHigherPriority("high", "medium")).toBe(true);
    expect(isHigherPriority("low", "high")).toBe(false);
  });

  it("topPriority finds the most urgent", () => {
    const list = [
      makeNotification({ priority: "low" }),
      makeNotification({ priority: "critical" }),
      makeNotification({ priority: "medium" }),
    ];
    expect(topPriority(list)).toBe("critical");
    expect(topPriority([])).toBeNull();
  });

  it("maps priority to base escalation", () => {
    expect(escalationForPriority("critical")).toBe("critical");
    expect(escalationForPriority("high")).toBe("persistent");
    expect(escalationForPriority("medium")).toBe("banner");
    expect(escalationForPriority("low")).toBe("silent");
  });

  it("escalate climbs and clamps the ladder", () => {
    expect(escalate("silent", 1)).toBe("banner");
    expect(escalate("banner", 2)).toBe("critical");
    expect(escalate("critical", 3)).toBe("critical");
    expect(escalate("banner", -5)).toBe("silent");
  });

  it("resolveEscalation climbs with snooze count for high priority", () => {
    expect(resolveEscalation("high", 0)).toBe("persistent");
    expect(resolveEscalation("high", 2)).toBe("critical");
  });

  it("low/silent never escalate", () => {
    expect(resolveEscalation("low", 5)).toBe("silent");
    expect(resolveEscalation("silent", 5)).toBe("silent");
  });
});
