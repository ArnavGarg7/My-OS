"use client";

import { useState } from "react";
import { Button, Input, Text } from "@myos/ui";
import { ASSET_TYPES, type AssetType } from "@myos/core/resource";

/**
 * AssetEditor (Sprint 4.3). Capture what you own. Leaving the current value blank is the
 * normal case — the valuation engine depreciates the purchase price instead, and an
 * explicit value always overrides it.
 */
export function AssetEditor({
  onCreate,
}: {
  onCreate: (input: {
    name: string;
    type?: AssetType;
    purchasePrice?: number;
    purchasedAt?: string;
    warrantyExpiresAt?: string | null;
    serialNumber?: string;
    location?: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>("electronics");
  const [price, setPrice] = useState("");
  const [purchasedAt, setPurchasedAt] = useState("");
  const [warranty, setWarranty] = useState("");
  const [serial, setSerial] = useState("");
  const [location, setLocation] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      type,
      purchasePrice: Number(price) || 0,
      ...(purchasedAt ? { purchasedAt } : {}),
      ...(warranty ? { warrantyExpiresAt: warranty } : {}),
      ...(serial.trim() ? { serialNumber: serial.trim() } : {}),
      ...(location.trim() ? { location: location.trim() } : {}),
    });
    setName("");
    setPrice("");
    setPurchasedAt("");
    setWarranty("");
    setSerial("");
    setLocation("");
  };

  return (
    <div className="border-border-subtle flex flex-col gap-2 rounded-md border p-3">
      <Text variant="caption" tone="subtle">
        ADD AN ASSET
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Asset name"
          placeholder="What did you buy?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-52"
        />
        <select
          aria-label="Asset type"
          value={type}
          onChange={(e) => setType(e.target.value as AssetType)}
          className="border-border bg-surface text-fg h-9 rounded-md border px-2 text-sm"
        >
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Input
          aria-label="Purchase price"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="max-w-28"
        />
        <Input
          aria-label="Purchase date"
          type="date"
          value={purchasedAt}
          onChange={(e) => setPurchasedAt(e.target.value)}
          className="max-w-40"
        />
        <Input
          aria-label="Warranty expiry"
          type="date"
          value={warranty}
          onChange={(e) => setWarranty(e.target.value)}
          className="max-w-40"
        />
        <Input
          aria-label="Serial number"
          placeholder="Serial…"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          className="max-w-36"
        />
        <Input
          aria-label="Location"
          placeholder="Where is it?"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="max-w-36"
        />
        <Button size="sm" onClick={submit} disabled={!name.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
