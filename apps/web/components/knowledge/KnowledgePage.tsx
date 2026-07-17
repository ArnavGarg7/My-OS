"use client";

import { PageHeader, StatBlock, Tabs, TabsContent, TabsList, TabsTrigger } from "@myos/ui";
import { PageContainer, PageLoading } from "@/components/framework";
import { trpc } from "@/lib/trpc/client";
import { useKnowledge } from "./use-knowledge";
import { NoteEditor } from "./NoteEditor";
import { NoteViewer } from "./NoteViewer";
import { WikiExplorer } from "./WikiExplorer";
import { WikiPageView } from "./WikiPage";
import { GraphView } from "./GraphView";
import { GraphInspector } from "./GraphInspector";
import { KnowledgeSearch } from "./KnowledgeSearch";
import { ReadingTracker } from "./ReadingTracker";
import { LearningWorkspace } from "./LearningWorkspace";
import { FlashcardDeck } from "./FlashcardDeck";
import { FlashcardReview } from "./FlashcardReview";
import { ResearchWorkspace } from "./ResearchWorkspace";
import { MemoryResurfacing } from "./MemoryResurfacing";
import { useState } from "react";

/**
 * KnowledgePage (Sprint 4.1). The /knowledge route — My OS as a second brain. Notes,
 * wiki + backlinks, reading, learning, flashcards, research, a deterministic graph and
 * ranked search, plus morning memory resurfacing. Editorial; reuses the design system.
 */
export function KnowledgePage() {
  const k = useKnowledge();
  const [graphSelected, setGraphSelected] = useState<string | null>(null);
  const [wikiSelected, setWikiSelected] = useState<string | null>(null);

  const wikiBacklinks = trpc.knowledge.backlinks.useQuery(
    { id: wikiSelected ?? "" },
    { enabled: !!wikiSelected },
  );
  const selectedWiki = k.wiki.find((w) => w.id === wikiSelected) ?? null;

  if (k.isLoading && k.notes.length === 0 && !k.summary) {
    return <PageLoading label="Loading your knowledge…" />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Knowledge"
        description="Your second brain — what you know, what you're learning, what to remember."
      />

      {k.portfolio ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <StatBlock label="Notes" value={String(k.portfolio.totalNotes)} />
          <StatBlock label="Wiki" value={String(k.portfolio.wikiPages)} />
          <StatBlock label="Books" value={String(k.portfolio.books)} />
          <StatBlock label="Courses" value={String(k.portfolio.courses)} />
          <StatBlock label="Flashcards" value={String(k.portfolio.flashcards)} />
          <StatBlock label="Graph" value={String(k.portfolio.graphSize)} />
        </div>
      ) : null}

      <Tabs defaultValue="notes">
        <TabsList>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="wiki">Wiki</TabsTrigger>
          <TabsTrigger value="reading">Reading</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="graph">Graph</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <NoteEditor onCreate={k.createNote} pending={k.pending} />
              <ul className="flex flex-col gap-1">
                {k.notes.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => k.setSelectedNoteId(n.id)}
                      className={`w-full rounded-md border px-3 py-2 text-left ${
                        n.id === k.selectedNoteId
                          ? "border-accent bg-surface-raised"
                          : "border-border-subtle hover:bg-surface-raised"
                      }`}
                    >
                      {n.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>{k.selectedNote ? <NoteViewer note={k.selectedNote} /> : null}</div>
          </div>
        </TabsContent>

        <TabsContent value="wiki">
          <div className="grid gap-6 lg:grid-cols-2">
            <WikiExplorer
              pages={k.wiki}
              selectedId={wikiSelected}
              onSelect={setWikiSelected}
              onCreate={k.createWiki}
            />
            <div>
              {selectedWiki ? (
                <WikiPageView page={selectedWiki} backlinks={wikiBacklinks.data ?? null} />
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reading">
          <ReadingTracker
            books={k.books}
            onAdd={k.createBook}
            onFinish={k.finishBook}
            onAdvance={(id, page) => k.updateBook(id, { currentPage: page })}
          />
        </TabsContent>

        <TabsContent value="learning">
          <LearningWorkspace
            courses={k.courses}
            onAdd={k.createCourse}
            onComplete={k.completeCourse}
            onAdvance={(id, modules) => k.updateCourse(id, { completedModules: modules })}
          />
        </TabsContent>

        <TabsContent value="flashcards">
          <div className="grid gap-6 lg:grid-cols-2">
            <FlashcardReview daily={k.daily} onGrade={k.reviewCard} />
            <FlashcardDeck
              decks={k.decks}
              cards={k.cards}
              onAddDeck={(title) => k.createDeck({ title })}
              onAddCard={k.createCard}
            />
          </div>
        </TabsContent>

        <TabsContent value="research">
          <ResearchWorkspace research={k.research} onAdd={k.createResearch} />
        </TabsContent>

        <TabsContent value="graph">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <GraphView graph={k.graph} selectedId={graphSelected} onSelect={setGraphSelected} />
            <GraphInspector graph={k.graph} selectedId={graphSelected} />
          </div>
        </TabsContent>

        <TabsContent value="search">
          <div className="grid gap-6 lg:grid-cols-2">
            <KnowledgeSearch
              query={k.query}
              onQuery={k.setQuery}
              results={k.searchResults}
              onSelect={(hit) => {
                if (hit.type === "note") k.setSelectedNoteId(hit.id);
              }}
            />
            <div className="flex flex-col gap-2">
              <MemoryResurfacing items={k.resurface} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
