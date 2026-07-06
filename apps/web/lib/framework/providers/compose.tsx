"use client";

import type { ComponentType, ReactNode } from "react";

export type ProviderComponent = ComponentType<{ children: ReactNode }>;

/**
 * Compose providers without nesting chaos (Sprint 1.4, Part 2). The first
 * provider in the list is the outermost.
 *   const AppProvider = composeProviders([A, B, C]);  //  <A><B><C>…</C></B></A>
 */
export function composeProviders(providers: ProviderComponent[]): ProviderComponent {
  return function ComposedProvider({ children }: { children: ReactNode }) {
    return providers.reduceRight<ReactNode>(
      (tree, Provider) => <Provider>{tree}</Provider>,
      children,
    );
  };
}
