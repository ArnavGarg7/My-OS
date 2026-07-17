"use client";

import { useState } from "react";
import { Button, Input, Text } from "@myos/ui";
import {
  INVESTMENT_TYPES,
  type InvestmentAccount,
  type InvestmentPortfolio,
  type InvestmentPosition,
  type InvestmentType,
} from "@myos/core/resource";
import { AccountsView } from "./AccountsView";
import { PortfolioView } from "./PortfolioView";
import { formatMoney } from "./resource-icons";

/**
 * InvestmentsPage (Sprint 4.3). Add holdings, update prices, view allocation. Prices are
 * typed by the user — there is no market API in this platform, by design.
 */
export function InvestmentsPage({
  accounts,
  positions,
  portfolio,
  onCreateAccount,
  onCreate,
  onUpdatePrice,
}: {
  accounts: InvestmentAccount[];
  positions: InvestmentPosition[];
  portfolio: InvestmentPortfolio | undefined;
  onCreateAccount: (input: { name: string; institution?: string }) => void;
  onCreate: (input: {
    accountId: string;
    symbol: string;
    type?: InvestmentType;
    quantity?: number;
    averageCost?: number;
    currentPrice?: number;
  }) => void;
  onUpdatePrice: (input: { id: string; currentPrice: number }) => void;
}) {
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState<InvestmentType>("stock");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");

  const accountId = accounts[0]?.id ?? "";

  const submit = () => {
    if (!symbol.trim() || !accountId) return;
    onCreate({
      accountId,
      symbol: symbol.trim(),
      type,
      quantity: Number(quantity) || 0,
      averageCost: Number(cost) || 0,
      currentPrice: Number(price) || 0,
    });
    setSymbol("");
    setQuantity("");
    setCost("");
    setPrice("");
  };

  return (
    <div className="flex flex-col gap-5">
      <AccountsView accounts={accounts} onCreate={onCreateAccount} />

      {accountId ? (
        <div className="border-border-subtle flex flex-col gap-2 rounded-md border p-3">
          <Text variant="caption" tone="subtle">
            ADD A HOLDING
          </Text>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              aria-label="Symbol"
              placeholder="Symbol…"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="max-w-32"
            />
            <select
              aria-label="Investment type"
              value={type}
              onChange={(e) => setType(e.target.value as InvestmentType)}
              className="border-border bg-surface text-fg h-9 rounded-md border px-2 text-sm"
            >
              {INVESTMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
            <Input
              aria-label="Quantity"
              placeholder="Qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="max-w-24"
            />
            <Input
              aria-label="Average cost"
              placeholder="Avg cost"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="max-w-28"
            />
            <Input
              aria-label="Current price"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="max-w-28"
            />
            <Button size="sm" onClick={submit} disabled={!symbol.trim()}>
              Add
            </Button>
          </div>
        </div>
      ) : null}

      <PortfolioView portfolio={portfolio} />

      {positions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Text variant="caption" tone="subtle">
            UPDATE PRICES
          </Text>
          {positions.map((p) => (
            <PriceRow key={p.id} position={p} onUpdatePrice={onUpdatePrice} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PriceRow({
  position,
  onUpdatePrice,
}: {
  position: InvestmentPosition;
  onUpdatePrice: (input: { id: string; currentPrice: number }) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0">
        <Text variant="body-s">{position.symbol}</Text>
      </span>
      <Text variant="caption" tone="subtle">
        now {formatMoney(position.currentPrice)}
      </Text>
      <Input
        aria-label={`New price for ${position.symbol}`}
        placeholder="New price…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="max-w-28"
      />
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          const next = Number(value);
          if (!Number.isFinite(next) || next <= 0) return;
          onUpdatePrice({ id: position.id, currentPrice: next });
          setValue("");
        }}
      >
        Update
      </Button>
    </div>
  );
}
