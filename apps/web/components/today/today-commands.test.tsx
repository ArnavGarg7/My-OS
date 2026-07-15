import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { render } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { ToastProvider } from "@myos/ui";
import { describe, expect, it } from "vitest";
import { ModalProvider } from "@/lib/framework";
import {
  CommandCenterProvider,
  useCommandRegistry,
  type CommandRegistry,
} from "@/lib/command-center";
import { trpc } from "@/lib/trpc/client";
import { TodayCommands } from "./today-commands";

function Wrapper({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({ links: [httpBatchLink({ url: "http://localhost/api/trpc" })] }),
  );
  return (
    <ToastProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ModalProvider>
            <CommandCenterProvider>{children}</CommandCenterProvider>
          </ModalProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ToastProvider>
  );
}

describe("TodayCommands", () => {
  it("registers the Today command group", () => {
    let registry: CommandRegistry | null = null;
    function Probe() {
      registry = useCommandRegistry();
      return null;
    }

    render(
      <Wrapper>
        <TodayCommands />
        <Probe />
      </Wrapper>,
    );

    expect(registry).not.toBeNull();
    const ids = registry!.getByCategory("today").map((c) => c.id);
    expect(ids).toContain("today:update-status");
    expect(ids).toContain("today:update-energy");
    expect(ids).toContain("today:open-notes");
    expect(ids).toContain("today:decision-history");
    expect(ids).toContain("today:morning-briefing");
  });

  it("registers a disabled Morning Briefing command", () => {
    let registry: CommandRegistry | null = null;
    function Probe() {
      registry = useCommandRegistry();
      return null;
    }
    render(
      <Wrapper>
        <TodayCommands />
        <Probe />
      </Wrapper>,
    );
    expect(registry!.isEnabled("today:morning-briefing")).toBe(false);
    expect(registry!.isEnabled("today:update-status")).toBe(true);
  });
});
