import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("web app manifest", () => {
  const m = manifest();

  it("is an installable standalone app", () => {
    expect(m.name).toBeTruthy();
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/today");
    expect(m.scope).toBe("/");
    expect(m.theme_color).toBe("#0a0a0c");
  });

  it("provides 192 + 512 icons including a maskable purpose", () => {
    expect(m.icons?.some((i) => i.sizes === "192x192")).toBe(true);
    expect(m.icons?.some((i) => i.sizes === "512x512")).toBe(true);
    expect(m.icons?.some((i) => i.purpose === "maskable")).toBe(true);
  });

  it("declares categories, shortcuts and screenshots", () => {
    expect(m.categories).toContain("productivity");
    expect((m.shortcuts?.length ?? 0)).toBeGreaterThan(0);
    expect(m.screenshots?.length).toBe(2);
    expect(m.screenshots?.some((s) => s.form_factor === "wide")).toBe(true);
  });
});
