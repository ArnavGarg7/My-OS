import { describe, expect, it } from "vitest";
import { captureSchema, organizeSchema, searchInboxSchema } from "./schemas";

describe("captureSchema", () => {
  it("accepts a valid capture and defaults the source", () => {
    const parsed = captureSchema.parse({ type: "note", content: "hi" });
    expect(parsed.source).toBe("quick_add");
  });

  it("rejects empty content", () => {
    expect(captureSchema.safeParse({ type: "note", content: "  " }).success).toBe(false);
  });

  it("rejects an unknown type", () => {
    expect(captureSchema.safeParse({ type: "widget", content: "x" }).success).toBe(false);
  });
});

describe("organizeSchema", () => {
  it("requires a valid destination", () => {
    expect(
      organizeSchema.safeParse({ id: crypto.randomUUID(), destination: "Nowhere" }).success,
    ).toBe(false);
    expect(
      organizeSchema.safeParse({ id: crypto.randomUUID(), destination: "Projects" }).success,
    ).toBe(true);
  });
});

describe("searchInboxSchema", () => {
  it("accepts partial queries", () => {
    expect(searchInboxSchema.parse({ text: "milk" }).text).toBe("milk");
    expect(searchInboxSchema.parse({}).text).toBeUndefined();
  });
});
