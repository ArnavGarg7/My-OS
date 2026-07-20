import { describe, expect, it } from "vitest";
import { StreamTimeoutError, consumeStream } from "./index";
import type { StreamChunk } from "../providers/types";

async function* chunks(parts: string[]): AsyncIterable<StreamChunk> {
  for (const p of parts) yield { delta: p, done: false };
  yield {
    delta: "",
    done: true,
    usage: { inputTokens: 1, outputTokens: parts.length, cachedTokens: 0 },
  };
}

describe("consumeStream", () => {
  it("accumulates text and captures final usage", async () => {
    const deltas: string[] = [];
    const state = await consumeStream(chunks(["Hel", "lo"]), { onDelta: (d) => deltas.push(d) });
    expect(state.text).toBe("Hello");
    expect(state.done).toBe(true);
    expect(state.chunks).toBe(2);
    expect(state.usage?.outputTokens).toBe(2);
    expect(deltas).toEqual(["Hel", "lo"]);
  });

  it("stops cooperatively on an aborted signal", async () => {
    const signal = { aborted: true };
    const state = await consumeStream(chunks(["a", "b"]), { signal });
    expect(state.cancelled).toBe(true);
    expect(state.text).toBe("");
  });

  it("throws StreamTimeoutError when the clock exceeds the budget", async () => {
    let t = 0;
    const now = () => (t += 1000);
    await expect(
      consumeStream(chunks(["a", "b", "c"]), { timeoutMs: 500, now }),
    ).rejects.toBeInstanceOf(StreamTimeoutError);
  });
});
