"use client";

import { Badge, Button, EmptyState, Text } from "@myos/ui";
import { valueAssets, type Asset, type AssetType } from "@myos/core/resource";
import { AssetEditor } from "./AssetEditor";
import { ASSET_TYPE_LABEL, AssetIcon, formatMoney } from "./resource-icons";

/**
 * AssetsPage (Sprint 4.3). What you own, with each asset's depreciated value derived on
 * render by the core — no stored valuation to go stale.
 */
export function AssetsPage({
  assets,
  onCreate,
  onSelect,
  onDelete,
  selectedId,
}: {
  assets: Asset[];
  onCreate: (input: { name: string; type?: AssetType; purchasePrice?: number }) => void;
  onSelect: (id: string) => void;
  onDelete: (input: { id: string }) => void;
  selectedId: string | null;
}) {
  const valued = valueAssets(assets, new Date());
  const total = valued.reduce((sum, v) => sum + v.currentValue, 0);

  return (
    <div className="flex flex-col gap-3">
      <AssetEditor onCreate={onCreate} />

      {valued.length === 0 ? (
        <EmptyState
          icon={AssetIcon}
          title="No assets yet"
          description="Add something you own to track its value, warranty and upkeep."
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <Text variant="caption" tone="subtle">
              {valued.length} asset{valued.length === 1 ? "" : "s"}
            </Text>
            <Text variant="body-s">{formatMoney(total)} current value</Text>
          </div>
          <ul className="flex flex-col gap-1">
            {valued.map((v) => (
              <li key={v.assetId}>
                <button
                  type="button"
                  onClick={() => onSelect(v.assetId)}
                  className={`border-border-subtle hover:bg-surface-subtle flex w-full items-center justify-between rounded-md border px-3 py-2 text-left ${
                    selectedId === v.assetId ? "border-accent" : ""
                  }`}
                >
                  <span className="flex flex-col">
                    <Text variant="body-s">{v.name}</Text>
                    <Text variant="caption" tone="subtle">
                      {ASSET_TYPE_LABEL[v.type]} · paid {formatMoney(v.purchasePrice)}
                    </Text>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    {v.underWarranty ? (
                      <Badge size="sm" variant="success">
                        Warranty
                      </Badge>
                    ) : null}
                    <Text variant="body-s">{formatMoney(v.currentValue)}</Text>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {selectedId ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() => onDelete({ id: selectedId })}
              className="self-start"
            >
              Delete selected
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
