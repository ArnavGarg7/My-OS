import { describe, expect, it } from "vitest";
import {
  enqueue,
  nextSendable,
  markSyncing,
  markSucceeded,
  markFailed,
  pruneSucceeded,
  requeueFailed,
  retryable,
  deriveSyncStatus,
  lastWriteWins,
  mergeField,
  isOfflineOp,
  MAX_ATTEMPTS,
  type OutboxEntry,
} from "./index";

/**
 * Offline sync (Stage 8). Deterministic outbox: ordered replay, dependency gating,
 * idempotent-by-id creation, retry ceiling, truthful status, per-field LWW conflict.
 */

const now = "2026-09-04T12:00:00.000Z";
function entry(over: Partial<OutboxEntry> = {}): OutboxEntry {
  return {
    clientMutationId: over.clientMutationId ?? "m1",
    op: over.op ?? "task.create",
    payload: over.payload ?? { title: "x" },
    status: over.status ?? "pending",
    seq: over.seq ?? 0,
    attempts: over.attempts ?? 0,
    createdAt: over.createdAt ?? now,
    updatedAt: over.updatedAt ?? now,
    dependsOn: over.dependsOn ?? [],
    error: over.error ?? null,
    label: over.label ?? null,
  };
}

describe("op whitelist — only personal ops are queueable", () => {
  it("accepts personal ops and rejects shared/external", () => {
    expect(isOfflineOp("task.create")).toBe(true);
    expect(isOfflineOp("focus.complete")).toBe(true);
    expect(isOfflineOp("collaboration.postMessage")).toBe(false);
    expect(isOfflineOp("connectors.createCalendarEvent")).toBe(false);
  });
});

describe("enqueue + ordering", () => {
  it("assigns increasing seq and sends in creation order", () => {
    let out: OutboxEntry[] = [];
    out = enqueue(out, entry({ clientMutationId: "a" }));
    out = enqueue(out, entry({ clientMutationId: "b" }));
    expect(out.map((e) => e.seq)).toEqual([1, 2]);
    expect(nextSendable(out).map((e) => e.clientMutationId)).toEqual(["a", "b"]);
  });
});

describe("dependency gating — create lands before its dependent", () => {
  it("does not send a dependent until its dependency has succeeded", () => {
    const out = [
      entry({ clientMutationId: "proj", seq: 1, status: "pending" }),
      entry({ clientMutationId: "task", seq: 2, dependsOn: ["proj"] }),
    ];
    // proj pending → task blocked
    expect(nextSendable(out).map((e) => e.clientMutationId)).toEqual(["proj"]);
    // proj succeeded → task now sendable
    const after = markSucceeded(out, "proj", now);
    expect(nextSendable(after).map((e) => e.clientMutationId)).toEqual(["task"]);
  });
  it("blocks a dependent permanently when its dependency failed", () => {
    const out = [
      entry({ clientMutationId: "proj", seq: 1, status: "failed", attempts: MAX_ATTEMPTS }),
      entry({ clientMutationId: "task", seq: 2, dependsOn: ["proj"] }),
    ];
    expect(nextSendable(out).map((e) => e.clientMutationId)).toEqual([]);
  });
});

describe("idempotency — same id never sent twice as pending", () => {
  it("a succeeded entry is not resent and prunes away", () => {
    let out = [entry({ clientMutationId: "a", status: "syncing", attempts: 1 })];
    out = markSucceeded(out, "a", now);
    expect(nextSendable(out)).toEqual([]);
    expect(pruneSucceeded(out)).toEqual([]);
  });
});

describe("retry + ceiling", () => {
  it("increments attempts on syncing and stops at the ceiling", () => {
    let out = [entry({ clientMutationId: "a" })];
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      out = markSyncing(out, "a", now);
      out = markFailed(out, "a", "network", now);
    }
    expect(out[0]!.attempts).toBe(MAX_ATTEMPTS);
    expect(nextSendable(out)).toEqual([]); // ceiling reached
    expect(retryable(out)).toEqual([]);
  });
  it("requeueFailed resets a failure to pending", () => {
    const out = requeueFailed(
      [entry({ clientMutationId: "a", status: "failed", error: "x", attempts: 1 })],
      now,
    );
    expect(out[0]!.status).toBe("pending");
    expect(out[0]!.error).toBeNull();
  });
});

describe("truthful sync status", () => {
  it("offline overrides everything", () => {
    expect(deriveSyncStatus([entry()], false, null).state).toBe("offline");
  });
  it("syncing > error > pending > synced", () => {
    expect(deriveSyncStatus([entry({ status: "syncing" })], true, null).state).toBe("syncing");
    expect(deriveSyncStatus([entry({ status: "failed" })], true, null).state).toBe("error");
    expect(deriveSyncStatus([entry({ status: "pending" })], true, null).state).toBe("pending");
    expect(deriveSyncStatus([], true, now).state).toBe("synced");
  });
  it("never reports synced while a mutation is pending", () => {
    const s = deriveSyncStatus([entry({ status: "pending" })], true, now);
    expect(s.state).not.toBe("synced");
    expect(s.pending).toBe(1);
  });
});

describe("conflict — field-level last-write-wins", () => {
  it("later timestamp wins; ties resolve to remote (server-authoritative)", () => {
    expect(lastWriteWins("2026-09-04T13:00:00Z", "2026-09-04T12:00:00Z")).toBe("local");
    expect(lastWriteWins("2026-09-04T12:00:00Z", "2026-09-04T13:00:00Z")).toBe("remote");
    expect(lastWriteWins(now, now)).toBe("equal");
    expect(
      mergeField(
        { value: "in_progress", updatedAt: "2026-09-04T13:00:00Z" },
        { value: "completed", updatedAt: "2026-09-04T12:00:00Z" },
      ),
    ).toBe("in_progress");
  });
});
