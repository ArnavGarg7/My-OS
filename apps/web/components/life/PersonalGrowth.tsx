"use client";

import { useState } from "react";
import { Button, Badge, EmptyState, Input, Text, cn } from "@myos/ui";
import { Target } from "lucide-react";
import { VISION_CATEGORIES, type PersonalReview, type VisionItem } from "@myos/core/life";
import { VISION_CATEGORY_ICON, VISION_CATEGORY_LABEL } from "./life-icons";

type VisionCategory = VisionItem["category"];

/**
 * PersonalGrowth (Sprint 4.2). Extends Goals into vision + identity — capture life-area
 * statements and identity commitments, and start structured period reviews. Deterministic.
 */
export function PersonalGrowth({
  vision,
  reviews,
  onAddVision,
  onStartReview,
}: {
  vision: VisionItem[];
  reviews: PersonalReview[];
  onAddVision: (input: {
    category: VisionCategory;
    statement: string;
    isIdentity?: boolean;
  }) => void;
  onStartReview: (input: { frequency: "weekly" | "monthly" | "quarterly" | "annual" }) => void;
}) {
  const [statement, setStatement] = useState("");
  const [category, setCategory] = useState<VisionCategory>("health");

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <div role="radiogroup" aria-label="Life area" className="flex flex-wrap gap-1.5">
          {VISION_CATEGORIES.map((c) => {
            const Icon = VISION_CATEGORY_ICON[c];
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={VISION_CATEGORY_LABEL[c]}
                onClick={() => setCategory(c)}
                className={cn(
                  "text-caption inline-flex items-center gap-1 rounded-md border px-2.5 py-1",
                  active
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-fg-muted hover:border-accent hover:bg-elevated",
                )}
              >
                <Icon size={13} aria-hidden />
                {VISION_CATEGORY_LABEL[c]}
              </button>
            );
          })}
        </div>
        <div className="flex items-end gap-2">
          <Input
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="I am someone who…"
            aria-label="Vision statement"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (!statement.trim()) return;
              onAddVision({ category, statement: statement.trim(), isIdentity: true });
              setStatement("");
            }}
          >
            Add
          </Button>
        </div>
        {vision.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No vision yet"
            description="Define who you're becoming across life areas."
          />
        ) : (
          <ul className="flex flex-col gap-1">
            {vision.map((v) => {
              const Icon = VISION_CATEGORY_ICON[v.category];
              return (
                <li
                  key={v.id}
                  className="border-border-subtle flex items-center justify-between rounded border px-3 py-1.5"
                >
                  <span className="flex items-center gap-2">
                    <Icon size={14} aria-hidden className="text-fg-subtle shrink-0" />
                    <Text variant="body-s">{v.statement}</Text>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Badge size="sm" variant="neutral">
                      {VISION_CATEGORY_LABEL[v.category]}
                    </Badge>
                    {v.isIdentity ? (
                      <Badge size="sm" variant="accent">
                        Identity
                      </Badge>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
            Reviews ({reviews.length})
          </Text>
          {(["weekly", "monthly", "quarterly", "annual"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant="ghost"
              onClick={() => onStartReview({ frequency: f })}
            >
              {f}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
