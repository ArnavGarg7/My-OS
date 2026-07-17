"use client";

import { Text } from "@myos/ui";
import type { BacklinkView, WikiPage } from "@myos/core/knowledge";
import { NoteViewer } from "./NoteViewer";
import { Backlinks } from "./Backlinks";
import { References } from "./References";
import { Tags } from "./Tags";

/**
 * WikiPageView (Sprint 4.1). Renders a wiki page with its markdown body, tags and the
 * backlink/reference panel — the Obsidian-style bidirectional links.
 */
export function WikiPageView({
  page,
  backlinks,
}: {
  page: WikiPage;
  backlinks: BacklinkView | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <NoteViewer
        note={{
          id: page.id,
          title: page.title,
          content: page.content,
          tags: page.tags,
          linkedTitles: page.linkedTitles,
          archived: false,
          pinned: false,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        }}
      />
      <Tags tags={page.tags} />
      <References linkedTitles={page.linkedTitles} />
      {backlinks ? <Backlinks view={backlinks} /> : null}
      <Text variant="caption" tone="subtle">
        Slug: {page.slug}
      </Text>
    </div>
  );
}
