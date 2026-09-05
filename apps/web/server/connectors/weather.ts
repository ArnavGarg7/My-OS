import "server-only";
import { getEnv } from "../env";

/**
 * Weather provider (Stage 9). The ONE place OpenWeather is fetched — server-side, key never
 * exposed. Part of the Connector Platform (Stage 4): weather is external data entering the
 * OS through a connector, not a standalone system. Every failure mode is an HONEST state —
 * no fabricated weather ever. When the key is missing, location is absent, or the provider
 * fails, we say so.
 */

export type WeatherStatus = "ok" | "unavailable" | "location_unavailable" | "error";

export interface WeatherReading {
  status: WeatherStatus;
  location: string | null;
  tempC: number | null;
  feelsLikeC: number | null;
  condition: string | null; // e.g. "Clouds"
  description: string | null; // e.g. "broken clouds"
  humidity: number | null;
  updatedAt: string | null;
  /** Honest note when not ok (shown in the UI). */
  message: string | null;
}

const OWM_URL = "https://api.openweathermap.org/data/2.5/weather";

function unavailable(status: WeatherStatus, message: string): WeatherReading {
  return {
    status,
    location: null,
    tempC: null,
    feelsLikeC: null,
    condition: null,
    description: null,
    humidity: null,
    updatedAt: null,
    message,
  };
}

/** Fetch current conditions for a city. Returns an honest state on any failure. */
export async function currentWeather(location: string | null): Promise<WeatherReading> {
  const key = getEnv().OPENWEATHER_API_KEY;
  if (!key) return unavailable("unavailable", "Weather isn't configured (no provider key).");
  const q = location?.trim();
  if (!q) return unavailable("location_unavailable", "Set a location to see the weather.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const url = `${OWM_URL}?q=${encodeURIComponent(q)}&units=metric&appid=${key}`;
    const res = await fetch(url, { signal: controller.signal });
    if (res.status === 404) return unavailable("location_unavailable", `Couldn't find "${q}".`);
    if (!res.ok) return unavailable("error", `Weather provider error (${res.status}).`);
    const data = (await res.json()) as {
      name?: string;
      main?: { temp?: number; feels_like?: number; humidity?: number };
      weather?: { main?: string; description?: string }[];
    };
    return {
      status: "ok",
      location: data.name ?? q,
      tempC: typeof data.main?.temp === "number" ? Math.round(data.main.temp) : null,
      feelsLikeC:
        typeof data.main?.feels_like === "number" ? Math.round(data.main.feels_like) : null,
      condition: data.weather?.[0]?.main ?? null,
      description: data.weather?.[0]?.description ?? null,
      humidity: data.main?.humidity ?? null,
      updatedAt: new Date().toISOString(),
      message: null,
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return unavailable(
      "error",
      aborted ? "Weather request timed out." : "Couldn't reach the weather provider.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
