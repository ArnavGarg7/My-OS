import { describe, expect, it } from "vitest";
import { searchEvents } from "./search";
import { makeEvent, makeStream } from "./fixtures";

describe("searchEvents", () => {
  const stream = makeStream();

  it("matches on title", () => {
    expect(searchEvents(stream, "groceries").map((e) => e.id)).toEqual(["d"]);
  });

  it("matches on source keyword", () => {
    expect(
      searchEvents(stream, "goal")
        .map((e) => e.id)
        .sort(),
    ).toEqual(["a", "e"]);
  });

  it("AND-matches multiple terms", () => {
    const events = [
      makeEvent({ id: "1", title: "Shipped the alpha release" }),
      makeEvent({ id: "2", title: "Shipped docs" }),
    ];
    expect(searchEvents(events, "shipped alpha").map((e) => e.id)).toEqual(["1"]);
  });

  it("searches stringified metadata", () => {
    const events = [makeEvent({ id: "m", title: "Payment", metadata: { merchant: "Zomato" } })];
    expect(searchEvents(events, "zomato").map((e) => e.id)).toEqual(["m"]);
  });

  it("returns the whole stream for a blank query", () => {
    expect(searchEvents(stream, "  ")).toHaveLength(5);
  });
});
