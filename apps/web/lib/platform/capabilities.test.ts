import { describe, expect, it } from "vitest";
import {
  detectCapabilities,
  detectDisplayMode,
  detectOperatingSystem,
  isStandalone,
} from "./capabilities";

describe("detectOperatingSystem", () => {
  it("maps user agents to an OS", () => {
    expect(detectOperatingSystem("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("ios");
    expect(detectOperatingSystem("Mozilla/5.0 (Linux; Android 14; Pixel)")).toBe("android");
    expect(detectOperatingSystem("Mozilla/5.0 (Windows NT 10.0; Win64)")).toBe("windows");
    expect(detectOperatingSystem("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)")).toBe("macos");
    expect(detectOperatingSystem("Mozilla/5.0 (X11; Ubuntu; Linux x86_64)")).toBe("linux");
    expect(detectOperatingSystem("")).toBe("unknown");
  });
});

describe("detectCapabilities", () => {
  it("returns a fully-populated boolean map", () => {
    const caps = detectCapabilities();
    const keys = [
      "serviceWorker",
      "push",
      "notifications",
      "backgroundSync",
      "periodicSync",
      "wakeLock",
      "battery",
      "idleDetection",
      "connectionInfo",
      "share",
    ] as const;
    for (const key of keys) {
      expect(typeof caps[key]).toBe("boolean");
    }
  });
});

describe("display mode", () => {
  it("defaults to browser under jsdom matchMedia", () => {
    // vitest.setup mocks matchMedia to matches:false.
    expect(detectDisplayMode()).toBe("browser");
    expect(isStandalone()).toBe(false);
  });
});
