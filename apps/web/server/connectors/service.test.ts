import { describe, expect, it, vi } from "vitest";
import type { Database } from "@myos/db";

/**
 * Connectors service tests (Sprint 6.4). The vault (real AES-256-GCM), repository and signals service
 * are mocked/exercised so the platform is proven WITHOUT a DB or network: credentials are encrypted and
 * never returned as plaintext, offline sync normalizes external payloads into DomainEvents, those events
 * are fed into the SAME signals cycle, health is banded, and a connector failure never throws upward.
 */

const now = new Date("2026-07-20T10:00:00.000Z");

vi.mock("../env", () => ({ getEnv: () => ({ MYOS_CONNECTOR_SECRET: "unit-test-secret" }) }));

// In-memory repository so we can assert what was persisted (esp. that only ciphertext is stored).
interface Acct {
  id: string;
  providerId: string;
  label: string;
  state: string;
  checkpoint: string | null;
  lastSyncAt: string | null;
  createdAt: string;
}
const store: {
  accounts: Record<string, Acct>;
  credentials: Record<string, { ciphertext: string; iv: string; tag: string; hint: string }>;
  events: {
    accountId: string;
    providerKey: string;
    kind: string;
    externalId: string;
    payload: Record<string, unknown>;
    occurredAt: string;
  }[];
} = { accounts: {}, credentials: {}, events: [] };
let idc = 0;

vi.mock("./repository", () => ({
  insertAccount: vi.fn(async (_db, providerId, label, state) => {
    const id = `a${(idc += 1)}`;
    store.accounts[id] = {
      id,
      providerId,
      label,
      state,
      checkpoint: null,
      lastSyncAt: null,
      createdAt: now.toISOString(),
    };
    return id;
  }),
  loadAccount: vi.fn(async (_db, id) => store.accounts[id] ?? null),
  listAccounts: vi.fn(async () => Object.values(store.accounts)),
  setAccountState: vi.fn(async (_db, id, state) => {
    if (store.accounts[id]) store.accounts[id]!.state = state;
  }),
  setAccountSync: vi.fn(async (_db, id, checkpoint, state, at: Date) => {
    if (store.accounts[id])
      Object.assign(store.accounts[id]!, { checkpoint, state, lastSyncAt: at.toISOString() });
  }),
  deleteAccount: vi.fn(async (_db, id) => {
    delete store.accounts[id];
    delete store.credentials[id];
  }),
  insertCredential: vi.fn(async (_db, accountId, sealed, hint) => {
    store.credentials[accountId] = { ...sealed, hint };
  }),
  loadCredential: vi.fn(async (_db, accountId) => {
    const c = store.credentials[accountId];
    return c ? { sealed: { ciphertext: c.ciphertext, iv: c.iv, tag: c.tag }, hint: c.hint } : null;
  }),
  credentialHint: vi.fn(async (_db, accountId) => store.credentials[accountId]?.hint ?? null),
  insertPermissions: vi.fn(async () => {}),
  listPermissions: vi.fn(async () => ["calendar.readonly"]),
  recordSyncJob: vi.fn(async () => {}),
  recordSyncHistory: vi.fn(async () => {}),
  listSyncHistory: vi.fn(async () => []),
  recordEvents: vi.fn(async (_db, accountId, providerKey, events) => {
    for (const e of events)
      store.events.push({ accountId, providerKey, ...e, occurredAt: e.occurredAt.toISOString() });
  }),
  listEvents: vi.fn(async (_db, accountId?: string) =>
    store.events.filter((e) => !accountId || e.accountId === accountId),
  ),
  countEvents: vi.fn(
    async (_db, accountId) => store.events.filter((e) => e.accountId === accountId).length,
  ),
  recordHealth: vi.fn(async () => {}),
  recordMetrics: vi.fn(async () => {}),
  latestMetrics: vi.fn(async () => []),
}));

// The signals seam: capture the extra events fed into the cycle.
const fedEvents: unknown[] = [];
vi.mock("../signals/service", () => ({
  run: vi.fn(async (_db, _tz, extra: unknown[]) => {
    fedEvents.push(...extra);
    return [];
  }),
}));

import * as service from "./service";
import { encryptSecret, decryptSecret, secretHint } from "./vault";
const db = {} as Database;

describe("vault — AES-256-GCM, never plaintext", () => {
  it("round-trips a secret and tampering fails the auth tag", () => {
    const sealed = encryptSecret("ghp_supersecrettoken1234");
    expect(sealed.ciphertext).not.toContain("supersecret");
    expect(decryptSecret(sealed)).toBe("ghp_supersecrettoken1234");
    expect(secretHint("ghp_supersecrettoken1234")).toBe("•••1234");
    expect(() =>
      decryptSecret({ ...sealed, tag: Buffer.from("0".repeat(16)).toString("base64") }),
    ).toThrow();
  });
});

describe("connect — encrypts credentials, returns only a hint", () => {
  it("stores ciphertext (not plaintext) and advances the lifecycle", async () => {
    const r = await service.connect(db, "github", "My GitHub", "ghp_token_abcd");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state).toBe("connected");
    expect(r.hint).toBe("•••abcd");
    // Persisted credential is ciphertext, never the secret.
    const stored = store.credentials[r.accountId]!;
    expect(stored.ciphertext).not.toContain("token_abcd");
    expect(decryptSecret(stored)).toBe("ghp_token_abcd");
  });
  it("rejects an unknown provider", async () => {
    expect((await service.connect(db, "nope")).ok).toBe(false);
  });
});

describe("sync — offline normalization feeds the SAME signal cycle", () => {
  it("normalizes external payloads into DomainEvents and feeds them to signals", async () => {
    const c = await service.connect(db, "github", "GH");
    if (!c.ok) throw new Error("connect failed");
    fedEvents.length = 0;
    const r = await service.sync(db, c.accountId, "Asia/Kolkata", "manual", now);
    expect(r.ok).toBe(true);
    expect(r.events.length).toBeGreaterThan(0);
    expect(r.events.map((e) => e.kind)).toContain("github.ci_failed");
    // The normalized events were fed into the signals cycle (the only intelligence coupling).
    expect(fedEvents.length).toBe(r.events.length);
  });
  it("returns gracefully for a missing account (never throws upward)", async () => {
    const r = await service.sync(db, "missing", "Asia/Kolkata", "manual", now);
    expect(r.ok).toBe(false);
    expect(r.events).toEqual([]);
  });
});

describe("list + health + disconnect", () => {
  it("lists providers with connected accounts", async () => {
    const l = await service.list(db);
    expect(l.providers.length).toBeGreaterThanOrEqual(6);
    expect(l.providers.some((p) => p.connected)).toBe(true);
  });
  it("bands health and disconnect removes the account + credential", async () => {
    const h = await service.health(db);
    expect(h.items.every((i) => i.score >= 0 && i.score <= 100)).toBe(true);
    const someId = Object.keys(store.accounts)[0]!;
    await service.disconnect(db, someId);
    expect(store.accounts[someId]).toBeUndefined();
    expect(store.credentials[someId]).toBeUndefined();
  });
});

describe("connectorEventsForSignals — seam gathers normalized events", () => {
  it("maps persisted events back into DomainEvents for the cycle", async () => {
    const evs = await service.connectorEventsForSignals(db);
    expect(Array.isArray(evs)).toBe(true);
    if (evs.length > 0) {
      expect(evs[0]!.ref?.module).toBe("connector");
      expect(typeof evs[0]!.kind).toBe("string");
    }
  });
});
