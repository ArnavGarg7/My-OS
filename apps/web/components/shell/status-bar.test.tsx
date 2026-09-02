import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformTestProviders } from "@/test/providers";
import { StatusBar } from "./status-bar";

describe("StatusBar", () => {
  it("renders a single System health item (online by default under jsdom)", () => {
    render(
      <PlatformTestProviders>
        <StatusBar />
      </PlatformTestProviders>,
    );
    // Infrastructure health is collapsed into one "System" item; details (incl. version) live in its
    // tooltip rather than as separate always-on debug items.
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByTitle(/v\d+\.\d+\.\d+/)).toBeInTheDocument();
  });
});
