import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  DailyReflectionRow,
  JournalEntryRow,
  JournalLinkRow,
  JournalReviewRow,
} from "@myos/db/schema";

// JournalService is server-only; mock the DB boundary (repository) and verify
// the engine wiring — hydration, links, reflections, reviews, search + summary.
const h = vi.hoisted(() => ({
  listEntries: vi.fn(),
  getEntry: vi.fn(),
  insertEntry: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
  listLinks: vi.fn(),
  linksForEntries: vi.fn(),
  insertLink: vi.fn(),
  listReflections: vi.fn(),
  getReflection: vi.fn(),
  upsertReflection: vi.fn(),
  listReviews: vi.fn(),
  insertReview: vi.fn(),
  entriesBetween: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import * as service from "./service";
import * as summary from "./summary";
import { prompts } from "./prompts";

const db = {} as never;
const TZ = "UTC";
const D = (s: string) => new Date(s);

function entryRow(over: Partial<JournalEntryRow> = {}): JournalEntryRow {
  return {
    id: "e1",
    title: "A day",
    content: "Today I wrote a lot.",
    entryType: "daily",
    mood: "good",
    tags: [],
    archived: false,
    createdAt: D("2026-07-07T09:00:00Z"),
    updatedAt: D("2026-07-07T09:00:00Z"),
    ...over,
  };
}

function linkRow(over: Partial<JournalLinkRow> = {}): JournalLinkRow {
  return {
    id: "l1",
    entryId: "e1",
    taskId: null,
    projectId: null,
    milestoneId: null,
    decisionId: null,
    plannerBlockId: null,
    createdAt: D("2026-07-07T09:00:00Z"),
    ...over,
  };
}

function reflectionRow(over: Partial<DailyReflectionRow> = {}): DailyReflectionRow {
  return {
    id: "r1",
    date: "2026-07-07",
    reflection: "Solid day.",
    wins: ["Shipped"],
    lessons: ["Start earlier"],
    gratitude: ["Coffee"],
    tomorrowFocus: "Deep work",
    completedAt: null,
    createdAt: D("2026-07-07T21:00:00Z"),
    ...over,
  };
}

function reviewRow(over: Partial<JournalReviewRow> = {}): JournalReviewRow {
  return {
    id: "rv1",
    period: "weekly",
    summary: "A productive week.",
    createdAt: D("2026-07-07T20:00:00Z"),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.listEntries.mockResolvedValue([]);
  h.linksForEntries.mockResolvedValue([]);
  h.listReflections.mockResolvedValue([]);
  h.listReviews.mockResolvedValue([]);
});

describe("entries", () => {
  it("creates an entry through the engine", async () => {
    h.insertEntry.mockResolvedValue(entryRow());
    const e = await service.create(db, {
      title: "A day",
      content: "body",
      entryType: "daily",
      mood: "good",
      tags: [],
    });
    expect(e.title).toBe("A day");
    expect(h.insertEntry).toHaveBeenCalledOnce();
  });

  it("rejects an empty entry", async () => {
    await expect(
      service.create(db, { title: "", content: "", entryType: "daily", mood: null, tags: [] }),
    ).rejects.toThrow(/title or content/);
  });

  it("hydrates entries with their links", async () => {
    h.listEntries.mockResolvedValue([entryRow()]);
    h.linksForEntries.mockResolvedValue([linkRow({ projectId: "p1" })]);
    const [e] = await service.list(db);
    expect(e?.links).toEqual([{ target: "project", targetId: "p1" }]);
  });

  it("updates an entry", async () => {
    h.getEntry.mockResolvedValue(entryRow());
    h.updateEntry.mockResolvedValue(entryRow({ title: "Renamed" }));
    const e = await service.update(db, { id: "e1", title: "Renamed" });
    expect(e.title).toBe("Renamed");
  });

  it("archives an entry", async () => {
    h.getEntry.mockResolvedValue(entryRow());
    h.updateEntry.mockResolvedValue(entryRow({ archived: true }));
    const e = await service.archive(db, "e1");
    expect(e.archived).toBe(true);
    expect(h.updateEntry).toHaveBeenCalledWith(
      db,
      "e1",
      expect.objectContaining({ archived: true }),
    );
  });

  it("deletes an entry", async () => {
    h.deleteEntry.mockResolvedValue(undefined);
    expect(await service.remove(db, "e1")).toEqual({ id: "e1" });
  });

  it("throws when getting a missing entry", async () => {
    h.getEntry.mockResolvedValue(undefined);
    await expect(service.get(db, "nope")).rejects.toThrow(/not found/);
  });
});

describe("links", () => {
  it("adds a columnar link", async () => {
    h.insertLink.mockResolvedValue(linkRow());
    await service.addLink(db, { entryId: "e1", target: "decision", targetId: "d1" });
    expect(h.insertLink).toHaveBeenCalledWith(db, {
      entryId: "e1",
      taskId: null,
      projectId: null,
      milestoneId: null,
      decisionId: "d1",
      plannerBlockId: null,
    });
  });

  it("lists an entry's links", async () => {
    h.linksForEntries.mockResolvedValue([linkRow({ taskId: "t1" }), linkRow({ projectId: "p1" })]);
    const links = await service.links(db, "e1");
    expect(links).toEqual([
      { target: "task", targetId: "t1" },
      { target: "project", targetId: "p1" },
    ]);
  });
});

describe("reflections", () => {
  it("upserts a daily reflection and marks it complete", async () => {
    h.upsertReflection.mockImplementation((_db: never, date: string, patch: never) =>
      Promise.resolve(reflectionRow({ date, ...(patch as object) })),
    );
    const r = await service.dailyReflection(db, TZ, {
      date: "2026-07-07",
      reflection: "Good day",
      wins: ["Shipped"],
      lessons: [],
      gratitude: [],
      tomorrowFocus: "",
    });
    expect(r.date).toBe("2026-07-07");
    const persisted = h.upsertReflection.mock.calls[0]?.[2] as { completedAt: Date | null };
    expect(persisted.completedAt).not.toBeNull();
  });

  it("leaves an empty reflection incomplete", async () => {
    h.upsertReflection.mockResolvedValue(reflectionRow());
    await service.dailyReflection(db, TZ, {
      date: "2026-07-07",
      reflection: "",
      wins: [],
      lessons: [],
      gratitude: [],
      tomorrowFocus: "",
    });
    const persisted = h.upsertReflection.mock.calls[0]?.[2] as { completedAt: Date | null };
    expect(persisted.completedAt).toBeNull();
  });

  it("lists reflections", async () => {
    h.listReflections.mockResolvedValue([reflectionRow()]);
    expect((await service.listReflections(db)).map((r) => r.id)).toEqual(["r1"]);
  });
});

describe("reviews", () => {
  it("uses a provided summary", async () => {
    h.insertReview.mockResolvedValue(reviewRow({ summary: "custom" }));
    const r = await service.createReview(db, TZ, { period: "weekly", summary: "custom" });
    expect(r.summary).toBe("custom");
    expect(h.insertReview).toHaveBeenCalledWith(db, { period: "weekly", summary: "custom" });
  });

  it("generates a deterministic summary when none is given", async () => {
    h.listReflections.mockResolvedValue([reflectionRow()]);
    h.listEntries.mockResolvedValue([entryRow({ mood: "good" })]);
    h.insertReview.mockImplementation((_db: never, v: { period: string; summary: string }) =>
      Promise.resolve(reviewRow({ summary: v.summary })),
    );
    const r = await service.createReview(db, TZ, { period: "weekly" });
    expect(r.summary).toContain("Weekly review");
  });
});

describe("summary + search + counts", () => {
  it("assembles the day summary", async () => {
    h.listEntries.mockResolvedValue([
      entryRow({ createdAt: D("2026-07-07T09:00:00Z"), mood: "good" }),
    ]);
    h.listReflections.mockResolvedValue([reflectionRow()]);
    const s = await summary.summary(db, TZ, "2026-07-07");
    expect(s.todaysEntries).toBe(1);
    expect(s.outstandingLesson).toBe("Start earlier");
    expect(s.mood.average).toBe(4);
  });

  it("counts entries/reflections", async () => {
    h.listEntries.mockResolvedValue([entryRow()]);
    h.listReflections.mockResolvedValue([reflectionRow()]);
    const c = await summary.counts(db, TZ);
    expect(c.entries).toBe(1);
    expect(c.reflections).toBe(1);
    expect(c.gratitude).toBe(1);
  });

  it("searches entries deterministically", async () => {
    h.listEntries.mockResolvedValue([
      entryRow({ id: "a", title: "gratitude", content: "x" }),
      entryRow({ id: "b", title: "other", content: "some gratitude here" }),
    ]);
    const results = await summary.search(db, "gratitude");
    expect(results[0]?.entry.id).toBe("a");
  });

  it("derives signals", async () => {
    h.listEntries.mockResolvedValue([entryRow({ createdAt: D("2026-07-07T09:00:00Z") })]);
    const sig = await summary.signals(db, TZ);
    expect(sig).toHaveProperty("writingStreak");
    expect(sig).toHaveProperty("loggedToday");
  });
});

describe("prompts", () => {
  it("returns context prompts", () => {
    expect(prompts(TZ, "morning")[0]?.context).toBe("morning");
  });

  it("chooses a context from the hour when unspecified", () => {
    expect(prompts(TZ).length).toBeGreaterThan(0);
  });
});
