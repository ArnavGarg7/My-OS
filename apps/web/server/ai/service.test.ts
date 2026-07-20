import { describe, expect, it } from "vitest";
import type { Database } from "@myos/db";
import * as service from "./service";

/**
 * Minimal fake Database that satisfies the chained calls the AI repository makes
 * (`insert().values()` awaited, and `insert().values().onConflictDoNothing().returning()`).
 * Records inserts so tests can assert the service persists.
 */
function fakeDb() {
  const inserted: unknown[] = [];
  const db = {
    insert() {
      return {
        values(v: unknown) {
          inserted.push(v);
          const thenable = {
            then(resolve: (value: unknown) => void) {
              resolve(undefined);
            },
            onConflictDoNothing() {
              return { returning: async () => [{ id: "1" }] };
            },
          };
          return thenable;
        },
      };
    },
  };
  return { db: db as unknown as Database, inserted };
}

describe("ai service — config + registry (no db)", () => {
  it("lists providers, models, tiers and the active tier", () => {
    const p = service.listProviders();
    expect(p.tier).toBe("local");
    expect(p.models.length).toBeGreaterThan(0);
    expect(p.models.some((m) => m.provider === "anthropic")).toBe(true);
    expect(p.capabilities).toContain("reasoning");
  });

  it("exposes the versioned prompt registry", () => {
    const prompts = service.prompts();
    expect(prompts.find((x) => x.name === "system.assistant")).toBeDefined();
  });
});

describe("ai service — context + budget demo", () => {
  it("builds a feature profile and allocates the token budget", () => {
    const r = service.contextDemo({ feature: "assistant" });
    expect(r.snapshots.length).toBeGreaterThan(0);
    expect(r.budget.totalTokens).toBeLessThanOrEqual(r.budget.budget);
    expect(r.budget.included.length).toBeGreaterThan(0);
  });

  it("falls back to assistant for an unknown feature", () => {
    expect(service.contextDemo({ feature: "nope" }).feature).toBe("assistant");
  });
});

describe("ai service — tools + structured", () => {
  it("lists tools and runs a demo tool through the pipeline", async () => {
    const r = await service.toolsDemo();
    expect(r.tools.length).toBeGreaterThan(0);
    expect(r.demo.ok).toBe(true);
  });

  it("validates structured output (valid / repaired / invalid)", () => {
    const r = service.structuredDemo();
    expect(r.valid.ok).toBe(true);
    expect(r.repaired.repairCount).toBe(1);
    expect(r.invalid.ok).toBe(false);
  });
});

describe("ai service — generation + telemetry + cost", () => {
  it("runs a generation through the gateway and records telemetry", async () => {
    const r = await service.generationDemo({ feature: "test-gen", prompt: "summarise my week" });
    expect(r.response.provider).toBe("local");
    expect(r.response.text).toContain("summarise my week");
    expect(r.lastEvent).not.toBeNull();

    const tel = service.telemetry();
    expect(tel.aggregate.count).toBeGreaterThan(0);

    const c = service.cost();
    expect(c.guard.verdict).toBe("ok");
    expect(typeof c.spend.totalUsd).toBe("number");
  });
});

describe("ai service — persistence", () => {
  it("probes provider health and persists a snapshot", async () => {
    const { db, inserted } = fakeDb();
    const statuses = await service.providerHealth(db);
    expect(statuses).toHaveLength(4);
    expect(inserted).toHaveLength(1);
  });

  it("seeds prompt versions idempotently", async () => {
    const { db } = fakeDb();
    const r = await service.syncPrompts(db);
    expect(r.total).toBeGreaterThan(0);
    expect(r.inserted).toBe(1);
  });

  it("runs the eval suite and persists the run", async () => {
    const { db, inserted } = fakeDb();
    const r = await service.runEval(db);
    expect(r.suite).toBe("structured");
    expect(r.passed).toBe(r.total);
    expect(inserted).toHaveLength(1);
  });
});
