"use client";

import { useState } from "react";
import { Badge, Button, Card, Input, Text } from "@myos/ui";
import { stateCounts, type Flashcard } from "@myos/core/knowledge";
import { FLASHCARD_STATE_BADGE, FLASHCARD_STATE_LABEL } from "./knowledge-icons";

interface Deck {
  id: string;
  title: string;
}

/**
 * FlashcardDeck (Sprint 4.1). Lists decks with their card-state breakdown and lets you
 * add a deck or a card to the selected deck. State counts are derived.
 */
export function FlashcardDeck({
  decks,
  cards,
  onAddDeck,
  onAddCard,
}: {
  decks: Deck[];
  cards: Flashcard[];
  onAddDeck: (title: string) => void;
  onAddCard: (input: { deckId: string; front: string; back: string }) => void;
}) {
  const [deckTitle, setDeckTitle] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [deckId, setDeckId] = useState<string | null>(decks[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Input
          value={deckTitle}
          onChange={(e) => setDeckTitle(e.target.value)}
          placeholder="New deck…"
          aria-label="Deck title"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (!deckTitle.trim()) return;
            onAddDeck(deckTitle.trim());
            setDeckTitle("");
          }}
        >
          Add deck
        </Button>
      </div>

      {decks.map((d) => {
        const deckCards = cards.filter((c) => c.deckId === d.id);
        const counts = stateCounts(deckCards);
        return (
          <Card key={d.id} className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <Text variant="body-m">{d.title}</Text>
              <div className="flex items-center gap-1">
                {(["new", "learning", "review", "mastered"] as const).map((s) =>
                  counts[s] > 0 ? (
                    <Badge key={s} size="sm" variant={FLASHCARD_STATE_BADGE[s]}>
                      {counts[s]} {FLASHCARD_STATE_LABEL[s].toLowerCase()}
                    </Badge>
                  ) : null,
                )}
              </div>
            </div>
            {deckId === d.id ? (
              <div className="flex flex-col gap-1.5">
                <Input
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Front"
                  aria-label="Card front"
                />
                <Input
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Back"
                  aria-label="Card back"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (!front.trim() || !back.trim()) return;
                    onAddCard({ deckId: d.id, front: front.trim(), back: back.trim() });
                    setFront("");
                    setBack("");
                  }}
                >
                  Add card
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setDeckId(d.id)}>
                Add cards
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}
