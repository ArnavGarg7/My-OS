import "server-only";
import { sampleEvent, type ProviderAdapter } from "./ics";

/**
 * Google Calendar adapter (Sprint 2.7). Normalizes Google events to the domain
 * shape. Real OAuth uses the existing Identity/Platform infra; this stand-in
 * returns deterministic normalized events until webhook sync lands.
 */
export const googleProvider: ProviderAdapter = {
  name: "google",
  async fetch() {
    return [
      sampleEvent("google", "Team Standup", 9, 9.5),
      sampleEvent("google", "Product Sync", 14, 15),
    ];
  },
};
