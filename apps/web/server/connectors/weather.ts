import "server-only";
import type { RawPayload } from "@myos/core/connectors";
import { getEnv } from "../env";
import type { LiveFetch } from "./feed";

/**
 * Weather provider. Real current conditions from AccuWeather (preferred) or OpenWeather (fallback) —
 * server-side, key never exposed. Part of the Connector Platform: weather is external data entering the
 * OS through a connector, not a standalone system. Every failure mode is an HONEST state — no fabricated
 * weather ever. Results are cached for 60 minutes because AccuWeather's free tier is ~50 calls/day and
 * the connector polls; weather barely changes within the hour anyway.
 */

export type WeatherStatus = "ok" | "unavailable" | "location_unavailable" | "error";

export interface WeatherReading {
  status: WeatherStatus;
  location: string | null;
  tempC: number | null;
  feelsLikeC: number | null;
  condition: string | null;
  description: string | null;
  humidity: number | null;
  updatedAt: string | null;
  /** Which provider produced this (for honest labelling). */
  provider: "accuweather" | "openweather" | null;
  /** Honest note when not ok (shown in the UI). */
  message: string | null;
}

const OWM_URL = "https://api.openweathermap.org/data/2.5/weather";
const ACCU_BASE = "https://dataservice.accuweather.com";
const CACHE_TTL_MS = 60 * 60 * 1000;

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
    provider: null,
    message,
  };
}

// Module-level caches (survive across requests in the same server process). Location keys are static;
// readings expire after the TTL so the free API quota isn't exhausted by the connector's polling.
const readingCache = new Map<string, { reading: WeatherReading; expires: number }>();
const accuLocationKey = new Map<string, string>();

async function withTimeout(url: string, ms = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── AccuWeather ────────────────────────────────────────────────────────────────
async function accuWeather(key: string, q: string): Promise<WeatherReading> {
  let locationKey = accuLocationKey.get(q.toLowerCase());
  if (!locationKey) {
    const res = await withTimeout(
      `${ACCU_BASE}/locations/v1/cities/search?apikey=${key}&q=${encodeURIComponent(q)}`,
    );
    if (res.status === 401 || res.status === 403)
      return unavailable("unavailable", "AccuWeather key rejected — check ACCUWEATHER_API_KEY.");
    if (!res.ok) return unavailable("error", `AccuWeather error (${res.status}).`);
    const cities = (await res.json()) as { Key?: string; LocalizedName?: string }[];
    const city = cities?.[0];
    if (!city?.Key) return unavailable("location_unavailable", `Couldn't find "${q}".`);
    locationKey = city.Key;
    accuLocationKey.set(q.toLowerCase(), locationKey);
  }

  const res = await withTimeout(
    `${ACCU_BASE}/currentconditions/v1/${locationKey}?apikey=${key}&details=true`,
  );
  if (!res.ok) return unavailable("error", `AccuWeather error (${res.status}).`);
  const arr = (await res.json()) as {
    WeatherText?: string;
    Temperature?: { Metric?: { Value?: number } };
    RealFeelTemperature?: { Metric?: { Value?: number } };
    RelativeHumidity?: number;
    LocalObservationDateTime?: string;
  }[];
  const c = arr?.[0];
  if (!c) return unavailable("error", "AccuWeather returned no conditions.");
  const text = c.WeatherText ?? null;
  return {
    status: "ok",
    location: q,
    tempC:
      typeof c.Temperature?.Metric?.Value === "number"
        ? Math.round(c.Temperature.Metric.Value)
        : null,
    feelsLikeC:
      typeof c.RealFeelTemperature?.Metric?.Value === "number"
        ? Math.round(c.RealFeelTemperature.Metric.Value)
        : null,
    condition: text,
    description: text,
    humidity: c.RelativeHumidity ?? null,
    updatedAt: c.LocalObservationDateTime ?? new Date().toISOString(),
    provider: "accuweather",
    message: null,
  };
}

// ── OpenWeather (fallback) ───────────────────────────────────────────────────────
async function openWeather(key: string, q: string): Promise<WeatherReading> {
  const res = await withTimeout(`${OWM_URL}?q=${encodeURIComponent(q)}&units=metric&appid=${key}`);
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
    feelsLikeC: typeof data.main?.feels_like === "number" ? Math.round(data.main.feels_like) : null,
    condition: data.weather?.[0]?.main ?? null,
    description: data.weather?.[0]?.description ?? null,
    humidity: data.main?.humidity ?? null,
    updatedAt: new Date().toISOString(),
    provider: "openweather",
    message: null,
  };
}

/** Is a real weather provider configured? */
export function weatherConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.ACCUWEATHER_API_KEY || env.OPENWEATHER_API_KEY);
}

/**
 * A LiveFetch for the Weather CONNECTOR — turns real current conditions (for WEATHER_LOCATION) into
 * normalized weather events, so the connector emits real data, not the sample feed. Reuses the cached
 * currentWeather so it never multiplies API calls. Emits ONLY when there's something notable (rain,
 * storm, temperature extreme); a calm hour honestly produces zero events. Hourly-idempotent id.
 */
export function makeWeatherLiveFetch(): LiveFetch {
  return async () => {
    const w = await currentWeather(null); // uses WEATHER_LOCATION
    if (w.status !== "ok") return [];
    const text = `${w.condition ?? ""} ${w.description ?? ""}`.toLowerCase();
    const at = w.updatedAt ?? new Date().toISOString();
    const hour = at.slice(0, 13); // idempotent within the hour
    const where = w.location ?? "your area";
    const out: RawPayload[] = [];
    if (/(rain|drizzle|shower)/.test(text)) {
      out.push({
        type: "forecast.rain",
        externalId: `weather-rain-${hour}`,
        at,
        fields: { label: `${w.description ?? "Rain"} in ${where}` },
      });
    }
    if (/(storm|thunder)/.test(text)) {
      out.push({
        type: "forecast.storm",
        externalId: `weather-storm-${hour}`,
        at,
        fields: { label: `${w.description ?? "Storm"} in ${where}` },
      });
    }
    if (typeof w.tempC === "number" && (w.tempC >= 38 || w.tempC <= 2)) {
      out.push({
        type: "forecast.temperature",
        externalId: `weather-temp-${hour}`,
        at,
        fields: { label: `${w.tempC}°C in ${where}` },
      });
    }
    return out;
  };
}

/** Fetch current conditions. AccuWeather first, then OpenWeather. Cached; honest state on any failure. */
export async function currentWeather(location: string | null): Promise<WeatherReading> {
  const env = getEnv();
  const q = (location?.trim() || env.WEATHER_LOCATION?.trim()) ?? "";
  if (!env.ACCUWEATHER_API_KEY && !env.OPENWEATHER_API_KEY)
    return unavailable("unavailable", "Weather isn't configured (no provider key).");
  if (!q) return unavailable("location_unavailable", "Set a location to see the weather.");

  const cacheKey = q.toLowerCase();
  const cached = readingCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.reading;

  try {
    const reading = env.ACCUWEATHER_API_KEY
      ? await accuWeather(env.ACCUWEATHER_API_KEY, q)
      : await openWeather(env.OPENWEATHER_API_KEY as string, q);
    if (reading.status === "ok") {
      readingCache.set(cacheKey, { reading, expires: Date.now() + CACHE_TTL_MS });
    }
    return reading;
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return unavailable(
      "error",
      aborted ? "Weather request timed out." : "Couldn't reach the weather provider.",
    );
  }
}
