import { describe, expect, it } from "vitest";
import { compareVersions, isNewerVersion, parseVersion } from "./version";

describe("parseVersion", () => {
  it("parses dotted numbers, treating junk as 0", () => {
    expect(parseVersion("1.2.3")).toEqual([1, 2, 3]);
    expect(parseVersion("1.x.3")).toEqual([1, 0, 3]);
  });
});

describe("compareVersions", () => {
  it("orders by segment", () => {
    expect(compareVersions("1.0.0", "1.0.1")).toBe(-1);
    expect(compareVersions("1.2.0", "1.1.9")).toBe(1);
    expect(compareVersions("2.0", "2.0.0")).toBe(0);
  });
  it("handles differing lengths", () => {
    expect(compareVersions("1.0", "1.0.1")).toBe(-1);
    expect(compareVersions("1.0.1", "1.0")).toBe(1);
  });
});

describe("isNewerVersion", () => {
  it("is true only when strictly newer", () => {
    expect(isNewerVersion("1.7.0", "1.6.0")).toBe(true);
    expect(isNewerVersion("1.6.0", "1.6.0")).toBe(false);
    expect(isNewerVersion("1.5.0", "1.6.0")).toBe(false);
  });
});
