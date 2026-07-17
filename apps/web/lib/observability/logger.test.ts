import { afterEach, describe, expect, it, vi } from "vitest";
import { logOperation, newRequestId, toLogError } from "./logger";

describe("structured logger", () => {
  afterEach(() => vi.restoreAllMocks());

  it("emits a single JSON line with the canonical field set", () => {
    const writes: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation((s) => (writes.push(String(s)), true));
    logOperation({
      requestId: "req_test",
      userId: "u1",
      module: "task",
      operation: "list",
      durationMs: 12,
      status: "ok",
    });
    expect(writes).toHaveLength(1);
    const parsed = JSON.parse(writes[0]!);
    expect(parsed).toMatchObject({
      level: "info",
      requestId: "req_test",
      userId: "u1",
      module: "task",
      operation: "list",
      durationMs: 12,
      status: "ok",
    });
    expect(parsed.ts).toBeDefined();
  });

  it("routes error status to stderr at error level with a log-safe error", () => {
    const errs: string[] = [];
    vi.spyOn(process.stderr, "write").mockImplementation((s) => (errs.push(String(s)), true));
    logOperation({
      requestId: "req_e",
      module: "finance",
      operation: "create",
      durationMs: 3,
      status: "error",
      error: toLogError(new TypeError("boom")),
    });
    const parsed = JSON.parse(errs[0]!);
    expect(parsed.level).toBe("error");
    expect(parsed.error).toEqual({ name: "TypeError", message: "boom" });
  });

  it("generates unique request ids", () => {
    expect(newRequestId()).not.toBe(newRequestId());
    expect(newRequestId()).toMatch(/^req_/);
  });
});
