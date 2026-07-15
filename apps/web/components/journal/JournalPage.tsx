"use client";

import { useState } from "react";
import { NotebookPen, ScrollText } from "lucide-react";
import { Button } from "@myos/ui";
import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { useModal } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { useJournal } from "./use-journal";
import { JournalQuickCapture } from "./JournalQuickCapture";
import { JournalEditor } from "./JournalEditor";
import { JournalHistory } from "./JournalHistory";
import { JournalViewer } from "./JournalViewer";
import { JournalSearch } from "./JournalSearch";
import { PromptSection } from "./PromptSection";
import { DailyReflection } from "./DailyReflection";

type Mode = "history" | "write" | "reflect";

/**
 * Journal page (Sprint 2.10). Quick capture + prompts on the left, the entry
 * history / selected entry in the centre. Writing and the daily reflection open
 * inline. Selecting an entry also feeds the shared context panel.
 */
export function JournalPage() {
  const journal = useJournal();
  const { open } = useModal();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);
  const [mode, setMode] = useState<Mode>("history");
  const [seed, setSeed] = useState("");

  const select = (id: string) => {
    journal.select(id);
    setMode("history");
    openContextPanel(true);
  };

  if (journal.isLoading) return <PageLoading label="Opening your journal…" />;

  const startReflection = () =>
    open(
      () => (
        <DailyReflection
          onSave={(draft) => journal.saveReflection({ ...draft, date: undefined })}
          pending={journal.pending}
        />
      ),
      { title: "Daily reflection", size: "lg" },
    );

  return (
    <PageContainer width="full" className="p-0">
      <PageContent className="gap-0 p-0">
        <div className="border-border flex flex-wrap items-center gap-2 border-b p-3">
          <Button
            size="sm"
            variant={mode === "write" ? "secondary" : "ghost"}
            onClick={() => {
              setMode("write");
              journal.select(null);
            }}
          >
            <NotebookPen size={14} aria-hidden />
            Write
          </Button>
          <Button size="sm" variant="ghost" onClick={startReflection}>
            <ScrollText size={14} aria-hidden />
            Reflect
          </Button>
          <div className="min-w-40 flex-1">
            <JournalSearch value={journal.query} onChange={journal.setQuery} />
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto p-4">
            {mode === "write" ? (
              <JournalEditor
                seed={seed}
                onSave={(input) => {
                  journal.create(input);
                  setSeed("");
                  setMode("history");
                }}
                onCancel={() => setMode("history")}
              />
            ) : journal.selected ? (
              <JournalViewer
                entry={journal.selected}
                onArchive={() => journal.archive(journal.selected!.id)}
                onDelete={() => journal.remove(journal.selected!.id)}
              />
            ) : (
              <JournalHistory
                entries={journal.view}
                selectedId={journal.selectedId}
                onSelect={select}
              />
            )}
          </div>

          <aside className="border-border hidden w-72 shrink-0 flex-col gap-5 overflow-y-auto border-l p-4 lg:flex">
            <JournalQuickCapture onCapture={journal.create} />
            <PromptSection
              prompts={journal.prompts}
              onPick={(text) => {
                setSeed(text + "\n\n");
                setMode("write");
                journal.select(null);
              }}
            />
          </aside>
        </div>
      </PageContent>
    </PageContainer>
  );
}
