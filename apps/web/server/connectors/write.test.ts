import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  listAccounts: vi.fn(),
  providerLiveAvailable: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => ({ listAccounts: h.listAccounts }));
vi.mock("./capabilities", () => ({ providerLiveAvailable: h.providerLiveAvailable }));

import { writeExternal } from "./write";

const db = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  h.listAccounts.mockResolvedValue([
    { id: "a1", providerId: "google-calendar", state: "connected" },
  ]);
  h.providerLiveAvailable.mockReturnValue(false);
});

describe("writeExternal — deterministic gating (MY OS → EXTERNAL)", () => {
  it("refuses an unknown provider", async () => {
    const r = await writeExternal(db, "nope", "calendar.create", {});
    expect(r).toEqual({ ok: false, reason: "unknown_provider" });
  });

  it("refuses a provider with no write capability (e.g. gmail) as unsupported", async () => {
    h.listAccounts.mockResolvedValue([{ id: "g", providerId: "gmail", state: "connected" }]);
    const r = await writeExternal(db, "gmail", "calendar.create", {});
    expect(r).toEqual({ ok: false, reason: "unsupported_action" });
  });

  it("refuses an action the provider does not support", async () => {
    const r = await writeExternal(db, "google-calendar", "mail.send" as never, {});
    expect(r).toEqual({ ok: false, reason: "unsupported_action" });
  });

  it("refuses when no account is connected", async () => {
    h.listAccounts.mockResolvedValue([]);
    const r = await writeExternal(db, "google-calendar", "calendar.create", {});
    expect(r).toEqual({ ok: false, reason: "not_connected" });
  });

  it("refuses honestly when connected but no live credentials (never fakes success)", async () => {
    h.providerLiveAvailable.mockReturnValue(false);
    const r = await writeExternal(db, "google-calendar", "calendar.create", { title: "x" });
    expect(r).toEqual({ ok: false, reason: "no_live_credentials" });
  });

  it("executes through the live seam when credentials are present", async () => {
    h.providerLiveAvailable.mockReturnValue(true);
    const liveWrite = vi.fn().mockResolvedValue({ externalId: "ext-123" });
    const r = await writeExternal(
      db,
      "google-calendar",
      "calendar.create",
      { title: "x" },
      liveWrite,
    );
    expect(liveWrite).toHaveBeenCalledWith("google-calendar", "calendar.create", { title: "x" });
    expect(r).toEqual({ ok: true, externalId: "ext-123" });
  });

  it("returns provider_error (not a throw) when the live seam fails", async () => {
    h.providerLiveAvailable.mockReturnValue(true);
    const liveWrite = vi.fn().mockRejectedValue(new Error("429"));
    const r = await writeExternal(db, "google-calendar", "calendar.create", {}, liveWrite);
    expect(r).toEqual({ ok: false, reason: "provider_error" });
  });
});
