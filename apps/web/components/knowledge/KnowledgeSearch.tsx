"use client";

import { Search } from "lucide-react";
import { Badge, Input, Text } from "@myos/ui";
import type { SearchHit } from "@myos/core/knowledge";
import { TYPE_ICON, TYPE_LABEL } from "./knowledge-icons";

/**
 * KnowledgeSearch (Sprint 4.1). Deterministic ranked search across notes, wiki, books,
 * courses and research — exact title > wiki > heading > tag > body > reference > recent.
 * No vectors, no semantic search; each hit shows why it matched.
 */
export function KnowledgeSearch({
  query,
  onQuery,
  results,
  onSelect,
}: {
  query: string;
  onQuery: (q: string) => void;
  results: SearchHit[];
  onSelect: (hit: SearchHit) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          size={14}
          aria-hidden
          className="text-fg-subtle absolute left-2.5 top-1/2 -translate-y-1/2"
        />
        <Input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search your knowledge…"
          aria-label="Search knowledge"
          className="pl-8"
        />
      </div>
      {query.trim().length > 0 ? (
        results.length === 0 ? (
          <Text variant="body-s" tone="subtle">
            No matches for “{query}”.
          </Text>
        ) : (
          <ul className="flex flex-col gap-1">
            {results.map((hit) => {
              const Icon = TYPE_ICON[hit.type];
              return (
                <li key={`${hit.type}-${hit.id}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(hit)}
                    className="border-border-subtle hover:bg-surface-raised w-full rounded-md border px-3 py-2 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <Icon size={13} aria-hidden />
                        <Text variant="body-s">{hit.title}</Text>
                      </span>
                      <Badge size="sm" variant="neutral">
                        {hit.reason}
                      </Badge>
                    </div>
                    <Text variant="caption" tone="subtle">
                      {TYPE_LABEL[hit.type]} · {hit.snippet}
                    </Text>
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : null}
    </div>
  );
}
