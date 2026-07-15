import { describe, expect, it } from "vitest";
import { NOTIFICATION_RULES, findRule, generateDrafts } from "../rules";

const now = new Date("2026-07-11T14:00:00Z");

describe("notification rules", () => {
  it("planner block starting within 10 min fires", () => {
    const drafts = generateDrafts({
      now,
      planner: { blockStartingTitle: "Write spec", blockStartingInMinutes: 8 },
    });
    expect(drafts.some((d) => d.trigger === "planner.block_starting")).toBe(true);
  });

  it("planner block far off does not fire", () => {
    const drafts = generateDrafts({
      now,
      planner: { blockStartingTitle: "Write spec", blockStartingInMinutes: 45 },
    });
    expect(drafts.some((d) => d.trigger === "planner.block_starting")).toBe(false);
  });

  it("meeting soon fires as high priority", () => {
    const drafts = generateDrafts({
      now,
      calendar: { meetingTitle: "Standup", meetingInMinutes: 5 },
    });
    const d = drafts.find((x) => x.trigger === "calendar.meeting_soon");
    expect(d?.priority).toBe("high");
  });

  it("budget exceeded fires as a warning", () => {
    const drafts = generateDrafts({ now, finance: { budgetExceededCategory: "Dining" } });
    const d = drafts.find((x) => x.trigger === "finance.budget_exceeded");
    expect(d?.type).toBe("warning");
    expect(d?.reason).toContain("Dining");
  });

  it("water overdue fires a low-priority health reminder", () => {
    const drafts = generateDrafts({ now, health: { waterOverdue: true } });
    const d = drafts.find((x) => x.trigger === "health.water_overdue");
    expect(d?.priority).toBe("low");
    expect(d?.type).toBe("health");
  });

  it("focus break due fires", () => {
    const drafts = generateDrafts({ now, focus: { breakDue: true } });
    expect(drafts.some((d) => d.trigger === "focus.break_due")).toBe(true);
  });

  it("tomorrow not planned fires a reminder", () => {
    const drafts = generateDrafts({ now, tomorrow: { notPlanned: true } });
    expect(drafts.some((d) => d.trigger === "tomorrow.not_planned")).toBe(true);
  });

  it("inbox overflow needs >20", () => {
    expect(generateDrafts({ now, inbox: { unreadCount: 20 } }).length).toBe(0);
    expect(generateDrafts({ now, inbox: { unreadCount: 21 } }).length).toBe(1);
  });

  it("empty context yields no drafts", () => {
    expect(generateDrafts({ now })).toEqual([]);
  });

  it("every rule builds a dedupe key + trigger + condition", () => {
    for (const rule of NOTIFICATION_RULES) {
      // Build with a maximal context so every build path runs.
      const draft = rule.build({
        now,
        planner: { blockStartingTitle: "b", blockStartingInMinutes: 5 },
        calendar: { meetingTitle: "m", meetingInMinutes: 5 },
        finance: { budgetExceededCategory: "c", billDueName: "b", subscriptionRenewingName: "s" },
        goals: { goalBehindTitle: "g", habitReminderTitle: "h" },
        projects: { milestoneDueTitle: "p" },
        inbox: { unreadCount: 30 },
      });
      expect(draft.dedupeKey).toContain(":");
      expect(draft.trigger.length).toBeGreaterThan(0);
      expect(draft.condition.length).toBeGreaterThan(0);
      expect(draft.payload).toBeDefined();
    }
  });

  it("findRule throws on unknown id", () => {
    expect(() => findRule("nope")).toThrow();
    expect(findRule("inbox-overflow").id).toBe("inbox-overflow");
  });

  it("multiple signals produce multiple drafts", () => {
    const drafts = generateDrafts({
      now,
      focus: { breakDue: true },
      health: { waterOverdue: true },
      finance: { billDueName: "Rent" },
    });
    expect(drafts.length).toBe(3);
  });
});
