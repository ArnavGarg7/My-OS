import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HealthProvider, useHealth, type HealthSummary } from "./health-provider";

function Probe() {
  const h = useHealth();
  return <span>{h.available ? `on:${h.energy}` : "off"}</span>;
}

describe("HealthProvider", () => {
  it("defaults to an unavailable placeholder", () => {
    render(<Probe />);
    expect(screen.getByText("off")).toBeInTheDocument();
  });

  it("exposes a provided summary", () => {
    const value: HealthSummary = {
      available: true,
      energy: "high",
      recoveryPercent: 80,
      headline: "Well rested",
    };
    render(
      <HealthProvider value={value}>
        <Probe />
      </HealthProvider>,
    );
    expect(screen.getByText("on:high")).toBeInTheDocument();
  });
});
