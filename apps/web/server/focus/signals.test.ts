import { beforeEach, describe, expect, it, vi } from "vitest";
import { completedSession, makeSession, makeInterruptionFixture } from "@myos/core/focus";

const h = vi.hoisted(() => ({
  getActive: vi.fn(),
  listByDate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import { focusSignals } from "./signals";

const TZ = "UTC";

// db stub whose planner-block query resolves to a controllable list.
let pendingBlocks: unknown[] = [];
const chain = {
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
};
chain.from.mockReturnValue(chain);
chain.where.mockReturnValue(chain);
chain.limit.mockImplementation(() => Promise.resolve(pendingBlocks));
const db = { select: vi.fn(() => chain) } as never;

beforeEach(() => {
  vi.clearAllMocks();
  pendingBlocks = [];
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.limit.mockImplementation(() => Promise.resolve(pendingBlocks));
  h.getActive.mockResolvedValue(null);
  h.listByDate.mockResolvedValue([]);
});

describe("focusSignals", () => {
  it("reports idle when nothing is active", async () => {
    const s = await focusSignals(db, TZ);
    expect(s.active).toBe(false);
    expect(s.status).toBe("idle");
  });

  it("flags too many interruptions", async () => {
    h.getActive.mockResolvedValue(
      makeSession({
        status: "running",
        interruptions: [1, 2, 3, 4].map((n) => makeInterruptionFixture({ id: `i${n}` })),
      }),
    );
    const s = await focusSignals(db, TZ);
    expect(s.tooManyInterruptions).toBe(true);
  });

  it("flags planner drift for unplanned work while blocks await", async () => {
    pendingBlocks = [{ id: "blk" }];
    h.getActive.mockResolvedValue(makeSession({ status: "running", plannerBlockId: null }));
    const s = await focusSignals(db, TZ);
    expect(s.plannerDrift).toBe(true);
  });

  it("aggregates today's focus minutes", async () => {
    h.listByDate.mockResolvedValue([completedSession("a", "deep_work", 40)]);
    const s = await focusSignals(db, TZ);
    expect(s.focusMinutesToday).toBe(40);
  });
});
