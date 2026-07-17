"use client";

import { BookOpen, Check } from "lucide-react";
import { Badge, Button, Card, Progress, Text } from "@myos/ui";
import { bookProgress, type Book } from "@myos/core/knowledge";
import { BOOK_STATUS_BADGE, BOOK_STATUS_LABEL } from "./knowledge-icons";

/**
 * BookCard (Sprint 4.1). A reading-tracker card — status, progress, pages and a quick
 * "mark finished" action. Progress is derived, never stored.
 */
export function BookCard({
  book,
  onFinish,
  onAdvance,
}: {
  book: Book;
  onFinish: (id: string) => void;
  onAdvance: (id: string, page: number) => void;
}) {
  const pct = bookProgress(book);
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen size={15} aria-hidden className="text-fg-subtle" />
          <div className="flex flex-col">
            <Text variant="body-m">{book.title}</Text>
            {book.author ? (
              <Text variant="caption" tone="subtle">
                {book.author}
              </Text>
            ) : null}
          </div>
        </div>
        <Badge size="sm" variant={BOOK_STATUS_BADGE[book.status]}>
          {BOOK_STATUS_LABEL[book.status]}
        </Badge>
      </div>
      <Progress value={pct} aria-label="Reading progress" />
      <div className="flex items-center justify-between">
        <Text variant="caption" tone="subtle">
          {book.currentPage}/{book.totalPages} pages · {pct}%
        </Text>
        {book.status === "reading" ? (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAdvance(book.id, Math.min(book.totalPages, book.currentPage + 10))}
            >
              +10p
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onFinish(book.id)}>
              <Check size={13} aria-hidden /> Finish
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
