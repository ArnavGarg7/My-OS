import { describe, expect, it } from "vitest";
import {
  buildSummary,
  isUnread,
  selectActive,
  selectCritical,
  selectQueued,
  selectUnread,
  sortByPriority,
} from "../selectors";
import { makeNotification } from "../fixtures";

const now = new Date("2026-07-11T14:00:00Z");

describe("selectors", () => {
  it("selectActive excludes terminal statuses", () => {
    const list = [
      makeNotification({ id: "a", status: "delivered" }),
      makeNotification({ id: "b", status: "completed" }),
      makeNotification({ id: "c", status: "dismissed" }),
    ];
    expect(selectActive(list).map((n) => n.id)).toEqual(["a"]);
  });

  it("isUnread + selectUnread", () => {
    expect(isUnread(makeNotification({ status: "delivered" }))).toBe(true);
    expect(isUnread(makeNotification({ status: "seen" }))).toBe(false);
    const list = [
      makeNotification({ id: "a", status: "delivered" }),
      makeNotification({ id: "b", status: "seen" }),
    ];
    expect(selectUnread(list).map((n) => n.id)).toEqual(["a"]);
  });

  it("selectQueued returns future scheduled/snoozed", () => {
    const list = [
      makeNotification({ id: "a", status: "snoozed", snoozedUntil: "2026-07-11T18:00:00Z" }),
      makeNotification({ id: "b", status: "scheduled", scheduledFor: "2026-07-11T10:00:00Z" }),
    ];
    expect(selectQueued(list, now).map((n) => n.id)).toEqual(["a"]);
  });

  it("sortByPriority orders by priority then recency", () => {
    const list = [
      makeNotification({ id: "low", priority: "low", createdAt: "2026-07-11T13:00:00Z" }),
      makeNotification({ id: "crit", priority: "critical", createdAt: "2026-07-11T12:00:00Z" }),
      makeNotification({ id: "med", priority: "medium", createdAt: "2026-07-11T13:30:00Z" }),
    ];
    expect(sortByPriority(list).map((n) => n.id)).toEqual(["crit", "med", "low"]);
  });

  it("selectCritical returns active critical only", () => {
    const list = [
      makeNotification({ id: "a", priority: "critical", status: "delivered" }),
      makeNotification({ id: "b", priority: "critical", status: "completed" }),
    ];
    expect(selectCritical(list).map((n) => n.id)).toEqual(["a"]);
  });

  it("buildSummary aggregates counts + top priority", () => {
    const list = [
      makeNotification({ id: "a", status: "delivered", priority: "high" }),
      makeNotification({ id: "b", status: "snoozed", snoozedUntil: "2026-07-11T18:00:00Z" }),
    ];
    const s = buildSummary(list, now, false, true);
    expect(s.unread).toBe(1);
    expect(s.queued).toBe(1);
    expect(s.active).toBe(2);
    expect(s.inQuietHours).toBe(true);
    expect(s.topPriority).toBe("high");
  });
});
