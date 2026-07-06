import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformTestProviders } from "@/test/providers";
import { useCommandRegistry, type CommandRegistry } from "@/lib/command-center";
import { PlatformCommands } from "./platform-commands";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("PlatformCommands", () => {
  it("registers the Platform command group", () => {
    let registry: CommandRegistry | null = null;
    function Probe() {
      registry = useCommandRegistry();
      return null;
    }

    render(
      <PlatformTestProviders>
        <PlatformCommands />
        <Probe />
      </PlatformTestProviders>,
    );

    expect(registry).not.toBeNull();
    const platform = registry!.getByCategory("platform");
    const ids = platform.map((c) => c.id);
    expect(ids).toContain("platform:reload");
    expect(ids).toContain("platform:check-updates");
    expect(ids).toContain("platform:app-info");
    expect(ids).toContain("platform:browser-settings");
    // Grouped under the "Platform" title.
    expect(registry!.getGroups().some((g) => g.id === "platform" && g.title === "Platform")).toBe(
      true,
    );
  });
});
