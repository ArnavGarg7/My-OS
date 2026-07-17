import { describe, it } from "vitest";
import { attentionItems, buildDashboard, buildReviewSnapshot, computeSignals } from "./index";
import {
  buildPortfolio,
  buildResourcePortfolio,
  makeAsset,
  makePortfolioInput,
  makePosition,
} from "../resource/index";
import { makeInput } from "./fixtures";

function bench(name: string, fn: () => void, iters = 5000): void {
  fn();
  const s: number[] = [];
  for (let i = 0; i < iters; i += 1) {
    const t0 = performance.now();
    fn();
    s.push((performance.now() - t0) * 1000);
  }
  s.sort((a, b) => a - b);
  const mean = s.reduce((x, y) => x + y, 0) / iters;
  console.log(
    `BENCH ${name} mean=${mean.toFixed(1)}us p95=${s[Math.floor(iters * 0.95)]!.toFixed(1)}us`,
  );
}

describe("perf baseline", () => {
  it("measures core derivations", () => {
    const input = makeInput();
    const now = new Date("2026-07-17T09:00:00.000Z");
    const rInput = makePortfolioInput({
      positions: Array.from({ length: 25 }, (_, i) =>
        makePosition({ id: `p${i}`, quantity: 10, averageCost: 100, currentPrice: 100 + i }),
      ),
      assets: Array.from({ length: 25 }, (_, i) => makeAsset({ id: `a${i}` })),
    });
    bench("intelligence.buildDashboard", () => buildDashboard(input));
    bench("intelligence.attentionItems", () => attentionItems(input));
    bench("intelligence.computeSignals", () => computeSignals(input));
    bench("intelligence.buildReviewSnapshot", () =>
      buildReviewSnapshot(input, "weekly", "2026-07-13", now),
    );
    bench("resource.buildResourcePortfolio", () => buildResourcePortfolio(rInput, now));
    bench("resource.buildPortfolio(25)", () => buildPortfolio(rInput.positions));
  });
});
