import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validateStructured } from "./index";

const schema = z.object({ name: z.string(), count: z.number() });

describe("validateStructured", () => {
  it("parses valid JSON", () => {
    const r = validateStructured('{"name":"a","count":2}', schema);
    expect(r.ok).toBe(true);
    expect(r.parsed).toEqual({ name: "a", count: 2 });
    expect(r.repairCount).toBe(0);
  });

  it("repairs code-fenced JSON in one attempt", () => {
    const r = validateStructured('```json\n{"name":"a","count":2}\n```', schema);
    expect(r.ok).toBe(true);
    expect(r.repairCount).toBe(1);
  });

  it("extracts the outermost object from surrounding prose", () => {
    const r = validateStructured('Here you go: {"name":"a","count":2} done', schema);
    expect(r.ok).toBe(true);
  });

  it("fails when no JSON is present", () => {
    const r = validateStructured("not json at all", schema);
    expect(r.ok).toBe(false);
    expect(r.parsed).toBeNull();
  });

  it("fails when JSON does not match the schema", () => {
    const r = validateStructured('{"name":"a"}', schema);
    expect(r.ok).toBe(false);
    expect(r.error).toBeDefined();
  });
});
