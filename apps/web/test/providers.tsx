import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState, type ReactNode } from "react";
import { ThemeProvider, ToastProvider, TooltipProvider } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { PlatformProvider } from "@/lib/platform";
import { CommandCenterProvider } from "@/lib/command-center";

/**
 * Test wrapper mirroring the app's client provider stack (theme + toast + data
 * layer + platform + command center). No network calls happen unless a mutation
 * is invoked, so the dummy tRPC client is fine for rendering.
 */
export function PlatformTestProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({ links: [httpBatchLink({ url: "http://localhost/api/trpc" })] }),
  );

  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <ToastProvider>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <PlatformProvider>
                <CommandCenterProvider>{children}</CommandCenterProvider>
              </PlatformProvider>
            </QueryClientProvider>
          </trpc.Provider>
        </ToastProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
