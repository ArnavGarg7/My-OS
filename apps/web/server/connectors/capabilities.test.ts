import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { deriveCapabilities } from "./capabilities";

describe("deriveCapabilities", () => {
  it("marks every provider not-live when no credentials are configured", () => {
    const caps = deriveCapabilities({});
    expect(caps.length).toBeGreaterThan(0);
    expect(caps.every((c) => c.liveAvailable === false)).toBe(true);
    // Each provider names the env var a real connection would require (never a value).
    expect(caps.find((c) => c.providerId === "google-calendar")?.requires).toBe(
      "MYOS_GOOGLE_CLIENT_ID",
    );
  });

  it("marks a provider live only when its credential env is present", () => {
    const caps = deriveCapabilities({ MYOS_GITHUB_CLIENT_ID: "abc" });
    const github = caps.find((c) => c.providerId === "github");
    const calendar = caps.find((c) => c.providerId === "google-calendar");
    expect(github?.liveAvailable).toBe(true);
    expect(calendar?.liveAvailable).toBe(false);
  });

  it("shares one Google credential across all Google providers", () => {
    const caps = deriveCapabilities({ MYOS_GOOGLE_CLIENT_ID: "g" });
    const googleIds = ["google-calendar", "gmail", "google-drive"];
    expect(caps.filter((c) => googleIds.includes(c.providerId)).every((c) => c.liveAvailable)).toBe(
      true,
    );
  });
});
