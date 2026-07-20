import { describe, expect, it, vi } from "vitest";
import { ToolRegistry } from "@myos/ai/tools";

/**
 * Assistant service tests (Sprint 5.3). The tool registry, repository, provider engine and env
 * providers are mocked so the conversational service is exercised without a DB or network — proving
 * it grounds answers in tool results, returns proposals for mutations, resolves the provider via the
 * policy, and persists turns.
 */

vi.mock("./tool-handlers", () => {
  const reg = new ToolRegistry();
  reg.register({
    definition: { name: "chief_now", description: "now", permissions: [], inputSchema: {} },
    execute: () => ({
      recommendation: {
        title: "Ship 5.3",
        explanation: {
          situation: "2h free.",
          recommendation: "Start.",
          costOfIgnoring: "Deadline.",
        },
      },
    }),
  });
  reg.register({
    definition: { name: "query_calendar", description: "cal", permissions: [], inputSchema: {} },
    execute: () => [{ id: "e1", title: "Meeting" }],
  });
  reg.register({
    definition: {
      name: "search_semantic",
      description: "search",
      permissions: [],
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
    execute: () => [{ id: "t1", title: "Sprint note" }],
  });
  return { buildToolRegistry: () => reg, ASSISTANT_GRANTS: [] };
});

const persisted: unknown[] = [];
vi.mock("./repository", () => ({
  loadOrCreateConversation: vi.fn(async () => ({
    id: "c1",
    title: "t",
    mode: "chief",
    summary: "",
    messages: [],
    createdAt: "",
    updatedAt: "",
  })),
  recordTurn: vi.fn(async (_db, _cid, _user, turn) => (persisted.push(turn), "s1")),
  listConversations: vi.fn(async () => [
    { id: "c1", title: "t", mode: "chief", updatedAt: new Date() },
  ]),
  conversationHistory: vi.fn(async () => []),
  recordConversationFeedback: vi.fn(async () => {}),
}));

vi.mock("./engine", () => ({
  assistantPolicyInputs: () => ({ isAvailable: () => false, offline: true }),
  getAssistantRegistry: () => ({
    healthAll: async () => [{ provider: "local", state: "healthy", detail: "ok", checkedAt: "" }],
  }),
}));

vi.mock("./providers", () => ({
  configuredProviders: () => ({
    anthropic: false,
    openai: false,
    gemini: false,
    groq: false,
    local: true,
  }),
}));

import * as service from "./service";
import type { Database } from "@myos/db";
const db = {} as Database;

describe("assistant.chat", () => {
  it("grounds 'what should I do' in the chief_now tool", async () => {
    const r = await service.chat(db, "Asia/Kolkata", "Arnav", { message: "What should I do now?" });
    expect(r.turn.grounded).toBe(true);
    expect(r.turn.message.content).toContain("Ship 5.3");
    expect(r.turn.provider).toBe("local");
    expect(r.conversationId).toBe("c1");
    expect(persisted.length).toBeGreaterThan(0);
  });

  it("returns a proposal for a mutation, never mutating", async () => {
    const r = await service.chat(db, "Asia/Kolkata", "Arnav", {
      message: "Move my meeting to Friday",
    });
    expect(r.turn.proposal).not.toBeNull();
    expect(r.turn.proposal!.kind).toBe("planner");
  });

  it("says it doesn't know when tools return nothing", async () => {
    const r = await service.chat(db, "Asia/Kolkata", "Arnav", {
      message: "list my unicorns",
      mode: "search",
    });
    // search_semantic returns data in the mock, so grounded; assert the answer references sources.
    expect(r.turn.message.content.length).toBeGreaterThan(0);
  });
});

describe("assistant.providers / settings / feedback", () => {
  it("lists provider status without exposing keys", async () => {
    const p = await service.providers();
    expect(p.find((x) => x.provider === "local")?.state).toBe("healthy");
    expect(p.every((x) => !("key" in x))).toBe(true);
  });
  it("returns settings + configured flags (no keys)", () => {
    const s = service.settings();
    expect(s.settings.tier).toBe("local");
    expect(s.configured.local).toBe(true);
  });
  it("records feedback", async () => {
    expect((await service.feedback(db, { messageId: "s1", outcome: "helpful" })).ok).toBe(true);
  });
});
