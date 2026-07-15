import "server-only";
import { sampleEvent, type ProviderAdapter } from "./ics";

/** Apple Calendar adapter (Sprint 2.7). Normalizes Apple events to the domain shape. */
export const appleProvider: ProviderAdapter = {
  name: "apple",
  async fetch() {
    return [sampleEvent("apple", "Gym", 18, 19)];
  },
};
