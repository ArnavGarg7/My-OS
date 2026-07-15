import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { render } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { ToastProvider } from "@myos/ui";
import { describe, expect, it, vi } from "vitest";
import { ModalProvider } from "@/lib/framework";
import {
  CommandCenterProvider,
  useCommandRegistry,
  type CommandRegistry,
} from "@/lib/command-center";
import { trpc } from "@/lib/trpc/client";
import { MorningCommands } from "./morning-commands";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

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

describe("MorningCommands", () => {
  it("registers the six Morning commands", () => {
    let registry: CommandRegistry | null = null;
    function Probe() {
      registry = useCommandRegistry();
      return null;
    }

    render(
      <Wrapper>
        <MorningCommands />
        <Probe />
      </Wrapper>,
    );

    const ids = registry!.getByCategory("morning").map((c) => c.id);
    expect(ids).toContain("morning:complete");
    expect(ids).toContain("morning:update-mission");
    expect(ids).toContain("morning:update-energy");
    expect(ids).toContain("morning:jump-recommendation");
    expect(ids).toContain("morning:review-yesterday");
    expect(ids).toContain("morning:checkin");
    expect(ids).toHaveLength(6);
  });
});
