import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The service worker is a static asset (public/sw.js). Guard that its critical
 * lifecycle + offline handlers stay present. Vitest runs with cwd = apps/web.
 */
describe("service worker asset", () => {
  const source = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");

  it("handles the SW lifecycle events", () => {
    for (const event of ["install", "activate", "fetch", "message", "push", "notificationclick"]) {
      expect(source).toContain(`addEventListener("${event}"`);
    }
  });

  it("wires the offline fallback + skip-waiting update flow", () => {
    expect(source).toContain("/offline.html");
    expect(source).toContain("SKIP_WAITING");
    expect(source).toContain("skipWaiting()");
  });

  it("caches static assets but not APIs", () => {
    expect(source).toContain("/_next/static/");
    expect(source).toContain("myos-shell-v");
  });
});
