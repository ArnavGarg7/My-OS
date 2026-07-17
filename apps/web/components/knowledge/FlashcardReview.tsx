"use client";

import { useState } from "react";
import { Button, Card, EmptyState, Text } from "@myos/ui";
import { Layers } from "lucide-react";
import type { DailyReview, Flashcard, ReviewGrade } from "@myos/core/knowledge";
import { GRADE_LABEL } from "./knowledge-icons";

/**
 * FlashcardReview (Sprint 4.1). A deterministic spaced-repetition review session — flip
 * a due card, grade it (again/hard/good/easy), and the pure scheduler advances it along
 * the fixed interval ladder. No ML.
 */
const GRADES: ReviewGrade[] = ["again", "hard", "good", "easy"];

export function FlashcardReview({
  daily,
  onGrade,
}: {
  daily: DailyReview | null;
  onGrade: (id: string, grade: ReviewGrade) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const cards: Flashcard[] = daily?.cards ?? [];
  const card = cards[0] ?? null;

  if (!daily || daily.dueCount === 0 || !card) {
    return (
      <EmptyState
        icon={Layers}
        title="All caught up"
        description="No flashcards are due for review right now."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Text variant="caption" tone="subtle">
        {daily.dueCount} due · {daily.newCount} new
      </Text>
      <Card className="flex min-h-[160px] flex-col items-center justify-center gap-3 p-6 text-center">
        <Text variant="heading-s">{card.front}</Text>
        {flipped ? (
          <Text variant="body-m" tone="subtle">
            {card.back}
          </Text>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setFlipped(true)}>
            Show answer
          </Button>
        )}
      </Card>
      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <Button
              key={g}
              size="sm"
              variant={g === "good" || g === "easy" ? "secondary" : "ghost"}
              onClick={() => {
                onGrade(card.id, g);
                setFlipped(false);
              }}
            >
              {GRADE_LABEL[g]}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
