/**
 * Connector lifecycle state machine (Sprint 6.4, spec §Connector Lifecycle). Pure transition logic —
 * all transitions explicit; an illegal transition throws so the server can never enter an
 * inconsistent connection state. No IO.
 */
import type { ConnectorState } from "./types";

const TRANSITIONS: Record<ConnectorState, ConnectorState[]> = {
  disconnected: ["authenticating"],
  authenticating: ["connected", "failed", "disconnected"],
  connected: ["syncing", "disconnected"],
  syncing: ["healthy", "warning", "failed"],
  healthy: ["syncing", "warning", "disconnected"],
  warning: ["syncing", "healthy", "failed", "disconnected"],
  failed: ["authenticating", "disconnected"],
};

export function canTransition(from: ConnectorState, to: ConnectorState): boolean {
  return TRANSITIONS[from].includes(to);
}

export function transition(from: ConnectorState, to: ConnectorState): ConnectorState {
  if (!canTransition(from, to)) throw new Error(`Illegal connector transition: ${from} → ${to}`);
  return to;
}

/** Whether a connector in this state is usable (syncing/healthy/warning). */
export function isConnected(state: ConnectorState): boolean {
  return state === "connected" || state === "syncing" || state === "healthy" || state === "warning";
}
