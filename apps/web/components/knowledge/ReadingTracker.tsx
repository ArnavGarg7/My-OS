"use client";

import { useState } from "react";
import { Button, EmptyState, Input } from "@myos/ui";
import { BookOpen } from "lucide-react";
import type { Book } from "@myos/core/knowledge";
import { BookCard } from "./BookCard";

/**
 * ReadingTracker (Sprint 4.1). The reading list — add books, track progress and mark
 * them finished. A "book.finished" timeline event fires from the hook on completion.
 */
export function ReadingTracker({
  books,
  onAdd,
  onFinish,
  onAdvance,
}: {
  books: Book[];
  onAdd: (input: { title: string; author?: string; totalPages?: number }) => void;
  onFinish: (id: string) => void;
  onAdvance: (id: string, page: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a book…"
          aria-label="Book title"
        />
        <Input
          value={pages}
          onChange={(e) => setPages(e.target.value)}
          placeholder="Pages"
          aria-label="Total pages"
          className="w-24"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (!title.trim()) return;
            onAdd({ title: title.trim(), totalPages: Number(pages) || 0 });
            setTitle("");
            setPages("");
          }}
        >
          Add
        </Button>
      </div>
      {books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books yet"
          description="Add a book to start tracking your reading."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {books.map((b) => (
            <BookCard key={b.id} book={b} onFinish={onFinish} onAdvance={onAdvance} />
          ))}
        </div>
      )}
    </div>
  );
}
