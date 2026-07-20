import { describe, expect, it } from "vitest";
import { cosine, embedDeterministic } from "./embeddings";
import { rankMemories } from "./ranking";
import { retrieveMemories } from "./retrieval";
import { reconcileMemories } from "./hygiene";
import type { Memory } from "../schemas";

function mem(id: string, content: string, over: Partial<Memory> = {}): Memory {
  return {
    id,
    kind: "fact",
    content,
    embedding: embedDeterministic(content),
    createdAt: "2026-07-01T00:00:00.000Z",
    lastUsedAt: null,
    useCount: 0,
    ...over,
  };
}

describe("cosine", () => {
  it("is 1 for identical vectors and 0 for degenerate", () => {
    const v = embedDeterministic("gym is close");
    expect(cosine(v, v)).toBeCloseTo(1, 5);
    expect(cosine([], [])).toBe(0);
    expect(cosine([1, 0], [1])).toBe(0);
  });
});

describe("ranking", () => {
  it("ranks the most similar memory first", () => {
    const memories = [mem("m1", "no deep work after 9pm"), mem("m2", "gym is 20 minutes away")];
    const ranked = rankMemories(
      memories,
      embedDeterministic("when can I do deep work"),
      new Date("2026-07-18T00:00:00Z"),
    );
    expect(ranked[0]!.memory.id).toBe("m1");
  });

  it("recency and use-count boost score", () => {
    const now = new Date("2026-07-18T00:00:00Z");
    const stale = mem("old", "topic alpha", { createdAt: "2026-01-01T00:00:00.000Z" });
    const fresh = mem("new", "topic alpha", {
      lastUsedAt: "2026-07-18T00:00:00.000Z",
      useCount: 5,
    });
    const ranked = rankMemories([stale, fresh], embedDeterministic("topic alpha"), now);
    expect(ranked[0]!.memory.id).toBe("new");
  });
});

describe("retrieval", () => {
  it("returns top-k with usage bumps applied to copies", () => {
    const memories = [
      mem("m1", "physics exam friday"),
      mem("m2", "buy milk"),
      mem("m3", "call dentist"),
    ];
    const { ranked, bumped } = retrieveMemories(memories, "exam", {
      k: 2,
      now: new Date("2026-07-18T00:00:00Z"),
    });
    expect(ranked).toHaveLength(2);
    expect(bumped[0]!.useCount).toBe(1);
    // original untouched
    expect(memories[0]!.useCount).toBe(0);
  });
});

describe("hygiene", () => {
  it("supersedes near-identical same-kind memories, keeping the newer", () => {
    const older = mem("old", "gym is 20 min away", { createdAt: "2026-01-01T00:00:00.000Z" });
    const newer = mem("new", "gym is 20 min away", { createdAt: "2026-07-01T00:00:00.000Z" });
    const result = reconcileMemories([older, newer]);
    expect(result.removedIds).toEqual(["old"]);
    expect(result.kept.map((m) => m.id)).toEqual(["new"]);
  });

  it("caps the active set by dropping least-recently-used", () => {
    const memories = Array.from({ length: 5 }, (_, i) =>
      mem(`m${i}`, `distinct memory number ${i} about ${"xyz".repeat(i + 1)}`, {
        lastUsedAt: `2026-07-0${i + 1}T00:00:00.000Z`,
      }),
    );
    const result = reconcileMemories(memories, 3);
    expect(result.kept).toHaveLength(3);
    expect(result.removedIds).toContain("m0");
  });
});
