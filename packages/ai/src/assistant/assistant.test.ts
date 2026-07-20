import { describe, expect, it } from "vitest";
import { ToolRegistry } from "../tools";
import { classifyMode, planIntent } from "./context-router";
import { runToolLoop } from "./tool-loop";
import { composeAnswer } from "./reasoning";
import { runTurn } from "./chief-chat";
import { appendMessage, newConversation, userMessage } from "./session";
import { windowHistory } from "./history";
import { updateSummary } from "./summarizer";
import { analyzeTurns } from "./analytics";
import { cite, dedupeCitations } from "./citations";
import type { AssistantTurn, Conversation } from "./types";

/** A registry with deterministic stub tools that return grounded data. */
function registry() {
  const reg = new ToolRegistry();
  reg.register({
    definition: {
      name: "chief_now",
      description: "current recommendation",
      permissions: [],
      inputSchema: {},
    },
    execute: () => ({
      recommendation: {
        title: "Finish Sprint 5.3",
        explanation: {
          situation: "You have 2h free.",
          recommendation: "Start now.",
          costOfIgnoring: "Deadline risk.",
        },
      },
    }),
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
    execute: (input) =>
      (input.query as string).includes("nothing") ? [] : [{ id: "n1", title: "Sprint 5.2 note" }],
  });
  reg.register({
    definition: { name: "query_calendar", description: "cal", permissions: [], inputSchema: {} },
    execute: () => [{ id: "e1", title: "Meeting" }],
  });
  return reg;
}

const conv: Conversation = newConversation("c1", "chief", new Date("2026-07-18T10:00:00Z"));
const deps = () => ({
  registry: registry(),
  now: () => new Date("2026-07-18T10:00:00Z"),
  newId: () => "m1",
});

describe("context router", () => {
  it("classifies modes deterministically", () => {
    expect(classifyMode("Move my workout to Friday")).toBe("planning");
    expect(classifyMode("When did I last work on Sprint 5.2?")).toBe("search");
    expect(classifyMode("What should I do now?")).toBe("chief");
    expect(classifyMode("automate my morning")).toBe("automation");
  });

  it("plans mutations as proposals", () => {
    expect(planIntent("move the meeting", "planning").mutation).toBe(true);
    expect(planIntent("what should I do", "chief").intent).toBe("recommend");
    expect(planIntent("why is this my priority", "chief").intent).toBe("explain");
    expect(planIntent("when did I last exercise", "search").intent).toBe("lookup");
  });
});

describe("tool loop", () => {
  it("executes tools and collects citations, grounded", async () => {
    const plan = planIntent("find my sprint notes", "search");
    const loop = await runToolLoop(plan, registry(), { granted: [] });
    expect(loop.grounded).toBe(true);
    expect(loop.citations.length).toBeGreaterThan(0);
    expect(loop.calls[0]!.tool).toBe("search_semantic");
  });

  it("reports not grounded when tools return nothing", async () => {
    const plan = planIntent("find nothing at all", "search");
    const loop = await runToolLoop(plan, registry(), { granted: [] });
    expect(loop.grounded).toBe(false);
  });
});

describe("reasoning", () => {
  it("says the OS doesn't know rather than hallucinate", async () => {
    const plan = planIntent("find nothing at all", "search");
    const loop = await runToolLoop(plan, registry());
    const answer = composeAnswer("find nothing at all", plan, loop);
    expect(answer.unknown).toBe(true);
    expect(answer.text.toLowerCase()).toContain("doesn't have");
  });
});

describe("runTurn (chief chat)", () => {
  it("answers 'what should I do' from the chief_now tool, grounded", async () => {
    const turn = await runTurn(conv, "What should I do now?", deps());
    expect(turn.mode).toBe("chief");
    expect(turn.message.content).toContain("Finish Sprint 5.3");
    expect(turn.grounded).toBe(true);
    expect(turn.provider).toBe("local");
    expect(turn.proposal).toBeNull();
  });

  it("returns a proposal for a mutation, never mutating", async () => {
    const turn = await runTurn(conv, "Move tomorrow's workout to Friday", deps());
    expect(turn.mode).toBe("planning");
    expect(turn.proposal).not.toBeNull();
    expect(turn.proposal!.kind).toBe("planner");
  });

  it("explains grounded in the recommendation", async () => {
    const turn = await runTurn(conv, "Why is this my priority?", deps());
    expect(turn.message.content).toContain("Cost of ignoring");
  });

  it("routes reasoning to an available cloud provider via policy", async () => {
    const turn = await runTurn(conv, "What should I do now?", {
      ...deps(),
      policy: { isAvailable: (p) => p === "anthropic" },
    });
    expect(turn.provider).toBe("anthropic");
  });
});

describe("session + history + summarizer", () => {
  it("appends messages and windows history", () => {
    let c = conv;
    for (let i = 0; i < 35; i++)
      c = appendMessage(c, userMessage(`u${i}`, `msg ${i}`, new Date("2026-07-18T10:00:00Z")));
    const w = windowHistory(c, 30);
    expect(w.window).toHaveLength(30);
    expect(w.summarizedCount).toBe(5);
  });

  it("summarizes folded messages extractively and caps length", () => {
    const folded = [userMessage("u1", "plan my day", new Date("2026-07-18T10:00:00Z"))];
    const s = updateSummary("", folded);
    expect(s).toContain("User asked");
  });
});

describe("analytics + citations", () => {
  it("aggregates turns", () => {
    const t: AssistantTurn[] = [
      {
        message: {
          id: "1",
          role: "assistant",
          content: "x",
          toolCalls: [{ tool: "chief_now", input: {}, ok: true, resultSummary: "", durationMs: 1 }],
          createdAt: "",
        },
        mode: "chief",
        provider: "local",
        proposal: null,
        grounded: true,
        unknown: false,
      },
      {
        message: { id: "2", role: "assistant", content: "y", createdAt: "" },
        mode: "search",
        provider: "local",
        proposal: null,
        grounded: false,
        unknown: true,
      },
    ];
    const a = analyzeTurns(t);
    expect(a.turns).toBe(2);
    expect(a.grounded).toBe(1);
    expect(a.unknown).toBe(1);
    expect(a.groundingRate).toBe(0.5);
  });

  it("dedupes citations", () => {
    expect(
      dedupeCitations([cite("task", "1", "a"), cite("task", "1", "a"), cite("task", "2", "b")]),
    ).toHaveLength(2);
  });
});
