import { describe, expect, it } from "vitest";
import { buildDedupeKey, findDuplicate, isDuplicate, refreshFromDraft } from "../deduplication";
import { makeDraft, makeNotification } from "../fixtures";

const now = new Date("2026-07-11T14:00:00Z");

describe("deduplication", () => {
  it("builds a stable dedupe key", () => {
    expect(buildDedupeKey("Planner", "Block Starting")).toBe("planner:block-starting");
  });

  it("finds an active duplicate", () => {
    const existing = [makeNotification({ dedupeKey: "focus:break-due", status: "delivered" })];
    expect(findDuplicate(existing, makeDraft({ dedupeKey: "focus:break-due" }))).not.toBeNull();
    expect(isDuplicate(existing, makeDraft({ dedupeKey: "focus:break-due" }))).toBe(true);
  });

  it("ignores terminal notifications when deduping", () => {
    const existing = [makeNotification({ dedupeKey: "focus:break-due", status: "completed" })];
    expect(isDuplicate(existing, makeDraft({ dedupeKey: "focus:break-due" }))).toBe(false);
  });

  it("does not match different keys", () => {
    const existing = [makeNotification({ dedupeKey: "focus:break-due", status: "delivered" })];
    expect(isDuplicate(existing, makeDraft({ dedupeKey: "health:water-overdue" }))).toBe(false);
  });

  it("refreshes an existing notification from a repeated draft", () => {
    const existing = makeNotification({ title: "old", updatedAt: "2026-07-11T13:00:00.000Z" });
    const refreshed = refreshFromDraft(
      existing,
      makeDraft({ title: "new", priority: "high" }),
      now,
    );
    expect(refreshed.title).toBe("new");
    expect(refreshed.priority).toBe("high");
    expect(refreshed.updatedAt).toBe(now.toISOString());
    expect(refreshed.id).toBe(existing.id);
    expect(refreshed.status).toBe(existing.status);
  });
});
