import "server-only";
import { sampleEvent, type ProviderAdapter } from "./ics";

/** Outlook adapter (Sprint 2.7). Normalizes Outlook events to the domain shape. */
export const outlookProvider: ProviderAdapter = {
  name: "outlook",
  async fetch() {
    return [sampleEvent("outlook", "Client Call", 11, 11.5)];
  },
};
