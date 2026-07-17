import { describe, expect, it } from "vitest";
import { birthdaysToday, nextBirthday, upcomingBirthdays, upcomingDates } from "./birthdays";
import {
  countThisMonth,
  dominantChannel,
  frequencyPerMonth,
  interactionsByType,
  interactionsFor,
  interactionsWithin,
  monthlyActivity,
} from "./interactions";
import {
  conferences,
  countEventsByKind,
  eventsByKind,
  eventsFor,
  introductions,
  mostConnected,
  professionalContacts,
  referrals,
} from "./networking";
import {
  byRoom,
  itemValue,
  rooms,
  totalInventoryValue,
  trackedAsAssets,
  valueByRoom,
} from "./home";
import {
  FIXED_NOW,
  interactionSeries,
  makeInteraction,
  makeInventoryItem,
  makeRelationship,
  makeRelationshipEvent,
} from "./fixtures";

describe("birthdays — year-agnostic recurrence", () => {
  it("resolves the next occurrence of an upcoming MM-DD", () => {
    // FIXED_NOW is 2026-07-16; a 07-20 birthday is 4 days away.
    const [d] = upcomingDates([makeRelationship({ birthday: "07-20" })], FIXED_NOW);
    expect(d?.date).toBe("2026-07-20");
    expect(d?.daysUntil).toBe(4);
  });

  it("rolls a passed birthday into next year", () => {
    const [d] = upcomingDates([makeRelationship({ birthday: "01-10" })], FIXED_NOW);
    expect(d?.date).toBe("2027-01-10");
    expect(d?.daysUntil).toBeGreaterThan(150);
  });

  it("treats today's birthday as today, not next year", () => {
    const [d] = upcomingDates([makeRelationship({ birthday: "07-16" })], FIXED_NOW);
    expect(d?.daysUntil).toBe(0);
    expect(birthdaysToday([makeRelationship({ birthday: "07-16" })], FIXED_NOW)).toHaveLength(1);
  });

  it("includes anniversaries alongside birthdays, soonest first", () => {
    const r = makeRelationship({ birthday: "12-25", anniversary: "07-18" });
    const all = upcomingDates([r], FIXED_NOW);
    expect(all).toHaveLength(2);
    expect(all[0]?.kind).toBe("anniversary");
  });

  it("skips archived people and unset dates", () => {
    expect(upcomingDates([makeRelationship({ archived: true })], FIXED_NOW)).toHaveLength(0);
    expect(
      upcomingDates([makeRelationship({ birthday: null, anniversary: null })], FIXED_NOW),
    ).toHaveLength(0);
  });

  it("the 7-day window excludes distant birthdays", () => {
    const near = makeRelationship({ id: "near", birthday: "07-20" });
    const far = makeRelationship({ id: "far", birthday: "11-01" });
    expect(upcomingBirthdays([near, far], FIXED_NOW).map((d) => d.relationshipId)).toEqual([
      "near",
    ]);
    expect(nextBirthday([near, far], FIXED_NOW)?.relationshipId).toBe("near");
  });

  it("nextBirthday is null when nothing is close", () => {
    expect(nextBirthday([makeRelationship({ birthday: "11-01" })], FIXED_NOW)).toBeNull();
  });
});

describe("interactions", () => {
  it("scopes to a relationship, newest first", () => {
    const list = [
      makeInteraction({ id: "a", relationshipId: "rel-1", occurredAt: "2026-01-01T09:00:00.000Z" }),
      makeInteraction({ id: "b", relationshipId: "rel-1", occurredAt: "2026-06-01T09:00:00.000Z" }),
      makeInteraction({ id: "c", relationshipId: "rel-2" }),
    ];
    const mine = interactionsFor(list, "rel-1");
    expect(mine.map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("filters by window", () => {
    const list = interactionSeries("rel-1", 5, 10, 0); // 0,10,20,30,40 days ago
    expect(interactionsWithin(list, FIXED_NOW, 25)).toHaveLength(3);
  });

  it("computes cadence per month over the strength window", () => {
    // 3 interactions in a 90-day (3-month) window → 1/month.
    const list = interactionSeries("rel-1", 3, 10, 0);
    expect(frequencyPerMonth(list, FIXED_NOW)).toBe(1);
  });

  it("counts and ranks channels", () => {
    const list = [
      makeInteraction({ id: "a", type: "call" }),
      makeInteraction({ id: "b", type: "call" }),
      makeInteraction({ id: "c", type: "email" }),
    ];
    expect(interactionsByType(list)).toEqual({ call: 2, email: 1 });
    expect(dominantChannel(list)).toBe("call");
  });

  it("dominantChannel is null with no history", () => {
    expect(dominantChannel([])).toBeNull();
  });

  it("buckets by month and counts the current one", () => {
    const list = [
      makeInteraction({ id: "a", occurredAt: "2026-07-01T09:00:00.000Z" }),
      makeInteraction({ id: "b", occurredAt: "2026-07-15T09:00:00.000Z" }),
      makeInteraction({ id: "c", occurredAt: "2026-06-15T09:00:00.000Z" }),
    ];
    expect(monthlyActivity(list)).toEqual({ "2026-07": 2, "2026-06": 1 });
    expect(countThisMonth(list, FIXED_NOW)).toBe(2);
  });
});

describe("networking", () => {
  it("filters and counts by kind", () => {
    const events = [
      makeRelationshipEvent({ id: "a", kind: "conference" }),
      makeRelationshipEvent({ id: "b", kind: "referral" }),
      makeRelationshipEvent({ id: "c", kind: "conference" }),
    ];
    expect(eventsByKind(events, "conference")).toHaveLength(2);
    expect(countEventsByKind(events)).toEqual({ conference: 2, referral: 1 });
    expect(conferences(events)).toHaveLength(2);
    expect(referrals(events)).toHaveLength(1);
    expect(introductions(events)).toHaveLength(0);
  });

  it("scopes events to a relationship", () => {
    const events = [
      makeRelationshipEvent({ id: "a", relationshipId: "rel-1" }),
      makeRelationshipEvent({ id: "b", relationshipId: "rel-2" }),
    ];
    expect(eventsFor(events, "rel-1").map((e) => e.id)).toEqual(["a"]);
  });

  it("selects the professional slice of the CRM", () => {
    const list = [
      makeRelationship({ id: "a", type: "friend" }),
      makeRelationship({ id: "b", type: "recruiter" }),
      makeRelationship({ id: "c", type: "colleague" }),
      makeRelationship({ id: "d", type: "colleague", archived: true }),
    ];
    expect(professionalContacts(list).map((r) => r.id)).toEqual(["b", "c"]);
  });

  it("ranks the most-connected contacts and drops those with no events", () => {
    const relationships = [
      makeRelationship({ id: "rel-1" }),
      makeRelationship({ id: "rel-2" }),
      makeRelationship({ id: "rel-3" }),
    ];
    const events = [
      makeRelationshipEvent({ id: "a", relationshipId: "rel-2" }),
      makeRelationshipEvent({ id: "b", relationshipId: "rel-2" }),
      makeRelationshipEvent({ id: "c", relationshipId: "rel-1" }),
    ];
    const ranked = mostConnected(relationships, events);
    expect(ranked.map((x) => x.relationship.id)).toEqual(["rel-2", "rel-1"]);
    expect(ranked[0]?.events).toBe(2);
  });
});

describe("home inventory", () => {
  it("values an item as quantity × unit value", () => {
    expect(itemValue(makeInventoryItem({ quantity: 4, unitValue: 5_000 }))).toBe(20_000);
  });

  it("totals the inventory", () => {
    const items = [
      makeInventoryItem({ id: "a", quantity: 2, unitValue: 100 }),
      makeInventoryItem({ id: "b", quantity: 1, unitValue: 300 }),
    ];
    expect(totalInventoryValue(items)).toBe(500);
  });

  it("groups by room and buckets blanks under Unassigned", () => {
    const items = [
      makeInventoryItem({ id: "a", room: "Kitchen", quantity: 1, unitValue: 100 }),
      makeInventoryItem({ id: "b", room: "Kitchen", quantity: 1, unitValue: 200 }),
      makeInventoryItem({ id: "c", room: "", quantity: 1, unitValue: 50 }),
    ];
    expect(valueByRoom(items)).toEqual({ Kitchen: 300, Unassigned: 50 });
    expect(rooms(items)).toEqual(["Kitchen", "Unassigned"]);
    expect(byRoom(items, "Kitchen")).toHaveLength(2);
  });

  it("identifies items promoted to full Asset rows", () => {
    const items = [
      makeInventoryItem({ id: "a", assetId: "asset-1" }),
      makeInventoryItem({ id: "b", assetId: null }),
    ];
    expect(trackedAsAssets(items).map((i) => i.id)).toEqual(["a"]);
  });
});
