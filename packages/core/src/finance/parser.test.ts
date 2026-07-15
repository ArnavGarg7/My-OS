import { describe, expect, it } from "vitest";
import { parseAmount, parseTransaction } from "./parser";

describe("parser", () => {
  it("parses amounts ignoring currency + separators", () => {
    expect(parseAmount("₹1,450.50")).toBe(1450.5);
    expect(parseAmount("spent 450")).toBe(450);
  });

  it("parses an expense with a category", () => {
    const t = parseTransaction("Spent 450 on groceries");
    expect(t.direction).toBe("expense");
    expect(t.amount).toBe(450);
    expect(t.category).toBe("groceries");
  });

  it("parses income", () => {
    const t = parseTransaction("Received 50000 salary");
    expect(t.direction).toBe("income");
    expect(t.category).toBe("income");
  });

  it("maps merchant keywords to categories", () => {
    expect(parseTransaction("paid 200 for uber").category).toBe("transport");
    expect(parseTransaction("netflix 500").category).toBe("subscriptions");
  });

  it("extracts a merchant after on/at/to", () => {
    expect(parseTransaction("spent 300 at Starbucks").merchant).toBe("Starbucks");
  });

  it("defaults to expense/other", () => {
    const t = parseTransaction("100 random thing");
    expect(t.direction).toBe("expense");
    expect(t.category).toBe("other");
  });
});
