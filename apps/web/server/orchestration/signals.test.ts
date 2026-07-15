import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({ listRuns: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => ({ listRuns: h.listRuns }));

import { orchestrationSignals } from "./signals";
import { makeRun } from "@myos/core/orchestration";

const db = {} as never;

beforeEach(() => vi.clearAllMocks());

describe("orchestrationSignals", () => {
  it("reports healthy with no failures", async () => {
    h.listRuns.mockResolvedValue([makeRun({ startedAt: new Date().toISOString() })]);
    const s = await orchestrationSignals(db, "UTC");
    expect(s.healthy).toBe(true);
    expect(s.failuresToday).toBe(0);
    expect(s.pendingPipelines).toBe(0);
  });

  it("reports unhealthy when a run failed today", async () => {
    h.listRuns.mockResolvedValue([
      makeRun({ startedAt: new Date().toISOString(), status: "failed" }),
    ]);
    const s = await orchestrationSignals(db, "UTC");
    expect(s.healthy).toBe(false);
    expect(s.failuresToday).toBe(1);
  });
});
