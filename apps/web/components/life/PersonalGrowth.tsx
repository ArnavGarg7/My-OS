"use client";

import { useState } from "react";
import { Button, Badge, EmptyState, Input, Text } from "@myos/ui";
import { Target } from "lucide-react";
import type { PersonalReview, VisionItem } from "@myos/core/life";

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
        <div className="flex items-end gap-2">
          <Input
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="I am someone who…"
            aria-label="Vision statement"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as VisionCategory)}
            aria-label="Life area"
            className="border-border-subtle bg-surface h-9 rounded-md border px-2 text-sm"
          >
            <option value="health">Health</option>
            <option value="career">Career</option>
            <option value="relationships">Relationships</option>
            <option value="finance">Finance</option>
            <option value="learning">Learning</option>
            <option value="personal">Personal</option>
            <option value="spiritual">Spiritual</option>
            <option value="recreation">Recreation</option>
          </select>
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
            {vision.map((v) => (
              <li
                key={v.id}
                className="border-border-subtle flex items-center justify-between rounded border px-3 py-1.5"
              >
                <Text variant="body-s">{v.statement}</Text>
                <span className="flex items-center gap-1.5">
                  <Badge size="sm" variant="neutral">
                    {v.category}
                  </Badge>
                  {v.isIdentity ? (
                    <Badge size="sm" variant="accent">
                      Identity
                    </Badge>
                  ) : null}
                </span>
              </li>
            ))}
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
