import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformTestProviders } from "@/test/providers";
import { StatusBar } from "./status-bar";

describe("StatusBar", () => {
  it("renders provider-driven platform status", () => {
    render(
      <PlatformTestProviders>
        <StatusBar />
      </PlatformTestProviders>,
    );
    // Connection is online by default under jsdom.
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    // App version comes from usePlatform().
    expect(screen.getByText(/^v\d+\.\d+\.\d+$/)).toBeInTheDocument();
  });
});
