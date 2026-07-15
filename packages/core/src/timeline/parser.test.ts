import { describe, expect, it } from "vitest";
import { parseDateQuery } from "./parser";

const NOW = new Date(Date.UTC(2026, 6, 10, 12));

describe("parseDateQuery", () => {
  it("parses an ISO date", () => {
    expect(parseDateQuery("2026-07-01", NOW)).toEqual({
      from: "2026-07-01",
      to: "2026-07-01",
      label: "2026-07-01",
    });
  });
  it("parses today + yesterday", () => {
    expect(parseDateQuery("today", NOW)?.from).toBe("2026-07-10");
    expect(parseDateQuery("yesterday", NOW)?.from).toBe("2026-07-09");
  });
  it("parses relative ranges", () => {
    expect(parseDateQuery("last week", NOW)).toMatchObject({
      from: "2026-07-03",
      to: "2026-07-10",
    });
    expect(parseDateQuery("last month", NOW)?.to).toBe("2026-07-10");
    expect(parseDateQuery("last year", NOW)?.label).toBe("Last 365 days");
  });
  it("returns null for gibberish", () => {
    expect(parseDateQuery("wibble", NOW)).toBeNull();
  });
});
