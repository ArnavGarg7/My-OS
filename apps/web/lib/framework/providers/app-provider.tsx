"use client";

import { composeProviders } from "./compose";
import { PreferencesProvider } from "./preferences";
import { LayoutProvider } from "./layout";
import { NavigationProvider } from "./navigation";
import { WorkspaceProvider } from "./workspace";
import { ShortcutProvider } from "./shortcuts";
import { OverlayProvider } from "./overlay";
import { ModalProvider } from "./modal";
import { ContextMenuProvider } from "./context-menu";

/**
 * The single application framework provider (Sprint 1.4, Part 2). Composes every
 * framework provider in a fixed, sane order so features get all of them with one
 * wrapper. Mount inside the design-system providers (theme/tooltip/toast).
 *
 * The Command Center registry is its own pillar (Sprint 1.6) and is mounted
 * separately (see app/providers.tsx), not composed here.
 */
export const AppProvider = composeProviders([
  PreferencesProvider,
  LayoutProvider,
  NavigationProvider,
  WorkspaceProvider,
  ShortcutProvider,
  OverlayProvider,
  ModalProvider,
  ContextMenuProvider,
]);
