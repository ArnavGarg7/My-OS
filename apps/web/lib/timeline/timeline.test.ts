import { describe, expect, it, vi } from "vitest";
import { TimelineEmitter } from "./emitter";
import { describeKind, TIMELINE_REGISTRY } from "./registry";
import { TIMELINE_KINDS } from "./types";

describe("TimelineEmitter", () => {
  it("emits an event with a deterministic id and defaulted timestamp", () => {
    const e = new TimelineEmitter();
    const ev = e.emit({ kind: "task.completed", source: "task", title: "Ship it" });
    expect(ev.id).toBe("tl_1");
    expect(ev.title).toBe("Ship it");
    expect(typeof ev.at).toBe("string");
  });

  it("honours a supplied timestamp and meta", () => {
    const e = new TimelineEmitter();
    const ev = e.emit({
      kind: "decision.accepted",
      source: "decision",
      title: "Focus",
      at: "2026-07-10T09:00:00.000Z",
      meta: { id: "d1" },
    });
    expect(ev.at).toBe("2026-07-10T09:00:00.000Z");
    expect(ev.meta).toEqual({ id: "d1" });
  });

  it("increments ids monotonically", () => {
    const e = new TimelineEmitter();
    e.emit({ kind: "task.created", source: "task", title: "a" });
    const second = e.emit({ kind: "task.created", source: "task", title: "b" });
    expect(second.id).toBe("tl_2");
  });

  it("notifies subscribers and can unsubscribe", () => {
    const e = new TimelineEmitter();
    const fn = vi.fn();
    const off = e.subscribe(fn);
    e.emit({ kind: "task.completed", source: "task", title: "x" });
    expect(fn).toHaveBeenCalledOnce();
    off();
    e.emit({ kind: "task.completed", source: "task", title: "y" });
    expect(fn).toHaveBeenCalledOnce();
  });

  it("returns recent events most-recent-first", () => {
    const e = new TimelineEmitter();
    e.emit({ kind: "task.created", source: "task", title: "first" });
    e.emit({ kind: "task.created", source: "task", title: "second" });
    expect(e.recent().map((x) => x.title)).toEqual(["second", "first"]);
  });

  it("bounds the ring buffer at capacity", () => {
    const e = new TimelineEmitter(2);
    e.emit({ kind: "task.created", source: "task", title: "a" });
    e.emit({ kind: "task.created", source: "task", title: "b" });
    e.emit({ kind: "task.created", source: "task", title: "c" });
    expect(e.recent().map((x) => x.title)).toEqual(["c", "b"]);
  });

  it("clears the buffer", () => {
    const e = new TimelineEmitter();
    e.emit({ kind: "task.created", source: "task", title: "a" });
    e.clear();
    expect(e.recent()).toEqual([]);
  });
});

describe("TimelineRegistry", () => {
  it("describes every registered kind", () => {
    for (const kind of TIMELINE_KINDS) {
      expect(describeKind(kind).label.length).toBeGreaterThan(0);
      expect(describeKind(kind).source).toBe(TIMELINE_REGISTRY[kind].source);
    }
  });
});
