import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TokenBundle } from "../connectors/oauth";

// Mock the boundaries so we test the scope-gating logic, not the connector service or DB.
const h = vi.hoisted(() => ({
  connectOAuth: vi.fn(async (..._a: unknown[]) => ({ ok: true as const })),
  oauthConfigured: vi.fn((_id: string) => true),
}));

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ getDb: () => ({ db: {}, sql: {} }) }));
vi.mock("../connectors/service", () => ({
  connectOAuth: (...a: unknown[]) => h.connectOAuth(...a),
}));
vi.mock("../connectors/oauth", () => ({
  oauthConfigured: (id: string) => h.oauthConfigured(id),
}));

import { seedGoogleConnectorsFromGrant } from "./connector-seed";

const CAL = "https://www.googleapis.com/auth/calendar.readonly";
const GMAIL = "https://www.googleapis.com/auth/gmail.readonly";
const DRIVE = "https://www.googleapis.com/auth/drive.metadata.readonly";

function bundle(scope: string | null, accessToken = "at"): TokenBundle {
  return { accessToken, refreshToken: "rt", expiresAt: null, scope };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.oauthConfigured.mockReturnValue(true);
});

describe("seedGoogleConnectorsFromGrant", () => {
  it("seeds only the providers whose scope was granted", async () => {
    await seedGoogleConnectorsFromGrant(bundle(`openid email ${CAL} ${GMAIL}`));
    const seeded = h.connectOAuth.mock.calls.map((c) => c[1]);
    expect(seeded).toEqual(["google-calendar", "gmail"]);
    expect(seeded).not.toContain("google-drive");
  });

  it("seeds all three when every scope is granted", async () => {
    await seedGoogleConnectorsFromGrant(bundle(`${CAL} ${GMAIL} ${DRIVE}`));
    expect(h.connectOAuth.mock.calls.map((c) => c[1])).toEqual([
      "google-calendar",
      "gmail",
      "google-drive",
    ]);
  });

  it("skips a provider whose OAuth app is not configured", async () => {
    h.oauthConfigured.mockImplementation((id: string) => id !== "gmail");
    await seedGoogleConnectorsFromGrant(bundle(`${CAL} ${GMAIL}`));
    expect(h.connectOAuth.mock.calls.map((c) => c[1])).toEqual(["google-calendar"]);
  });

  it("does nothing without an access token or scopes", async () => {
    await seedGoogleConnectorsFromGrant(bundle(CAL, ""));
    await seedGoogleConnectorsFromGrant(bundle(null));
    expect(h.connectOAuth).not.toHaveBeenCalled();
  });

  it("passes the token bundle through for the granted provider", async () => {
    await seedGoogleConnectorsFromGrant(bundle(CAL));
    expect(h.connectOAuth).toHaveBeenCalledWith(
      expect.anything(),
      "google-calendar",
      expect.objectContaining({ accessToken: "at", refreshToken: "rt" }),
      "Google Calendar",
    );
  });
});
