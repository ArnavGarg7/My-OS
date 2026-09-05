"use client";

import { useState } from "react";
import { Cloud, CloudRain, MapPin, Snowflake, Sun } from "lucide-react";
import { Button, Card, MonoLabel, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Weather widget (Stage 9). Real OpenWeather data via the Connector Platform (server-side
 * key). Honest states throughout — never fabricated weather: unavailable (no key),
 * location-unavailable (with a place to set one), error/timeout, and loading. Location is a
 * per-device preference in localStorage (no location is sent anywhere except the provider
 * query the user asked for).
 */
const LOCATION_KEY = "myos.weather.location";

function iconFor(condition: string | null) {
  const c = (condition ?? "").toLowerCase();
  if (c.includes("rain") || c.includes("drizzle")) return CloudRain;
  if (c.includes("snow")) return Snowflake;
  if (c.includes("cloud")) return Cloud;
  return Sun;
}

export function WeatherWidget() {
  const [location, setLocation] = useState<string | null>(() =>
    typeof window !== "undefined" ? window.localStorage.getItem(LOCATION_KEY) : null,
  );
  const [draft, setDraft] = useState("");
  const query = trpc.connectors.weather.useQuery(
    { location },
    { staleTime: 10 * 60_000, refetchOnWindowFocus: false },
  );

  const saveLocation = (value: string) => {
    const v = value.trim();
    if (!v) return;
    window.localStorage.setItem(LOCATION_KEY, v);
    setLocation(v);
  };

  const data = query.data;
  const Icon = iconFor(data?.condition ?? null);

  return (
    <Card variant="standard" padding="lg" className="flex flex-col gap-2">
      <MonoLabel tone="subtle">Weather</MonoLabel>

      {query.isLoading ? (
        <Text variant="body-s" tone="subtle">
          Loading…
        </Text>
      ) : data?.status === "ok" ? (
        <div className="flex items-center gap-3">
          <Icon size={28} className="text-accent" aria-hidden />
          <div className="min-w-0">
            <Text variant="heading-s">
              {data.tempC}°C · {data.location}
            </Text>
            <Text variant="caption" tone="subtle" className="capitalize">
              {data.description} · feels {data.feelsLikeC}°C
            </Text>
          </div>
        </div>
      ) : data?.status === "location_unavailable" ? (
        <div className="flex flex-col gap-2">
          <Text variant="body-s" tone="subtle">
            {data.message}
          </Text>
          <div className="flex gap-1.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveLocation(draft)}
              placeholder="City, e.g. London"
              className="border-border bg-base focus:border-accent flex-1 rounded-md border px-2 py-1 text-sm outline-none"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => saveLocation(draft)}
              leftIcon={<MapPin size={12} aria-hidden />}
            >
              Set
            </Button>
          </div>
        </div>
      ) : (
        <Text variant="body-s" tone="subtle">
          {data?.message ?? "Weather unavailable."}
        </Text>
      )}

      {data?.status === "ok" && data.updatedAt ? (
        <Text variant="caption" tone="subtle">
          Updated{" "}
          {new Date(data.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
          ·{" "}
          <button
            type="button"
            className="hover:text-fg underline"
            onClick={() => {
              window.localStorage.removeItem(LOCATION_KEY);
              setLocation(null);
            }}
          >
            change
          </button>
        </Text>
      ) : null}
    </Card>
  );
}
