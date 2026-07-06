"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState, type ReactNode } from "react";
import { ThemeProvider, ToastProvider, TooltipProvider } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { AppProvider } from "@/lib/framework";
import { AuthShellProvider, IdentityBridge } from "@/lib/identity";
import { CommandCenterProvider } from "@/lib/command-center";
import { PlatformProvider } from "@/lib/platform";

/**
 * App-wide providers: theming, tooltips, toasts (from @myos/ui) + the client
 * data layer (TanStack Query + tRPC, 04 §4). ThemeProvider owns `data-theme`
 * and its persistence; the design-system overlays need their providers mounted
 * once at the root.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: "/api/trpc" })],
    }),
  );

  return (
    <AuthShellProvider>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider delayDuration={300}>
          <ToastProvider>
            <trpc.Provider client={trpcClient} queryClient={queryClient}>
              <QueryClientProvider client={queryClient}>
                <AppProvider>
                  <PlatformProvider>
                    <CommandCenterProvider>
                      <IdentityBridge>{children}</IdentityBridge>
                    </CommandCenterProvider>
                  </PlatformProvider>
                </AppProvider>
              </QueryClientProvider>
            </trpc.Provider>
          </ToastProvider>
        </TooltipProvider>
      </ThemeProvider>
    </AuthShellProvider>
  );
}
