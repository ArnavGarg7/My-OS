"use client";

import { useState } from "react";
import { Badge, Button, EmptyState, Input, Text } from "@myos/ui";
import {
  VEHICLE_TYPES,
  type RenewalItem,
  type Vehicle,
  type VehicleType,
} from "@myos/core/resource";
import { VehicleIcon, formatCountdown } from "./resource-icons";

/**
 * VehiclesPage (Sprint 4.3). Registration and pollution countdowns, derived on render.
 * Fuel, service, tires and repairs are maintenance rows against the vehicle's linked asset
 * — this platform has exactly one scheduler rather than two that drift apart.
 */
export function VehiclesPage({
  vehicles,
  renewals,
  onCreate,
}: {
  vehicles: Vehicle[];
  renewals: RenewalItem[];
  onCreate: (input: {
    name: string;
    type?: VehicleType;
    registrationNumber?: string;
    registrationExpiresAt?: string | null;
    pollutionExpiresAt?: string | null;
    odometer?: number;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<VehicleType>("car");
  const [registration, setRegistration] = useState("");
  const [regExpiry, setRegExpiry] = useState("");
  const [pucExpiry, setPucExpiry] = useState("");
  const [odometer, setOdometer] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      type,
      ...(registration.trim() ? { registrationNumber: registration.trim() } : {}),
      ...(regExpiry ? { registrationExpiresAt: regExpiry } : {}),
      ...(pucExpiry ? { pollutionExpiresAt: pucExpiry } : {}),
      odometer: Number(odometer) || 0,
    });
    setName("");
    setRegistration("");
    setRegExpiry("");
    setPucExpiry("");
    setOdometer("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border-subtle flex flex-col gap-2 rounded-md border p-3">
        <Text variant="caption" tone="subtle">
          ADD A VEHICLE
        </Text>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            aria-label="Vehicle name"
            placeholder="Vehicle name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-40"
          />
          <select
            aria-label="Vehicle type"
            value={type}
            onChange={(e) => setType(e.target.value as VehicleType)}
            className="border-border bg-surface text-fg h-9 rounded-md border px-2 text-sm"
          >
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Input
            aria-label="Registration number"
            placeholder="Registration…"
            value={registration}
            onChange={(e) => setRegistration(e.target.value)}
            className="max-w-36"
          />
          <Input
            aria-label="Odometer"
            placeholder="km"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            className="max-w-24"
          />
          <Input
            aria-label="Registration expiry"
            type="date"
            value={regExpiry}
            onChange={(e) => setRegExpiry(e.target.value)}
            className="max-w-40"
          />
          <Input
            aria-label="Pollution certificate expiry"
            type="date"
            value={pucExpiry}
            onChange={(e) => setPucExpiry(e.target.value)}
            className="max-w-40"
          />
          <Button size="sm" onClick={submit} disabled={!name.trim()}>
            Add
          </Button>
        </div>
      </div>

      {renewals.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            RENEWALS DUE
          </Text>
          {renewals.map((r) => (
            <div
              key={r.id}
              className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-2"
            >
              <Text variant="body-s">{r.name}</Text>
              <Badge size="sm" variant={r.expired ? "danger" : "warning"}>
                {formatCountdown(r.daysUntil)}
              </Badge>
            </div>
          ))}
        </div>
      ) : null}

      {vehicles.length === 0 ? (
        <EmptyState
          icon={VehicleIcon}
          title="No vehicles yet"
          description="Add a vehicle to track registration, pollution and service."
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {vehicles.map((v) => (
            <li
              key={v.id}
              className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="flex flex-col">
                <Text variant="body-s">{v.name}</Text>
                <Text variant="caption" tone="subtle">
                  {v.type}
                  {v.registrationNumber ? ` · ${v.registrationNumber}` : ""}
                  {v.odometer > 0 ? ` · ${v.odometer.toLocaleString("en-IN")} km` : ""}
                </Text>
              </span>
              {v.insurancePolicyId ? (
                <Badge size="sm" variant="success">
                  Insured
                </Badge>
              ) : (
                <Badge size="sm" variant="neutral">
                  No policy linked
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
