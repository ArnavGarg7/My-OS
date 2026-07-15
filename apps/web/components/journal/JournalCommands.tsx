"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  BookOpen,
  CalendarRange,
  Heart,
  Link2,
  NotebookPen,
  ScrollText,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useShellStore } from "@/lib/shell/store";
import { useJournal } from "./use-journal";

/** Journal command group (Sprint 2.10). Registration only. Mount once in shell. */
export function JournalCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const journal = useJournal();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);

  const groups = useMemo<CommandGroup[]>(() => {
    const go = () => router.push("/journal");
    const need = () => toaster.info("Select an entry first.");

    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void,
    ) => ({
      id: `journal:${id}`,
      title,
      category: "journal",
      icon,
      keywords: ["journal", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    return [
      {
        id: "journal",
        title: "Journal",
        category: "journal",
        priority: 90,
        commands: [
          cmd("new", "New Entry", NotebookPen, ["write", "entry"], go),
          cmd("reflection", "Daily Reflection", ScrollText, ["reflect"], go),
          cmd("gratitude", "Gratitude", Heart, ["grateful"], () => {
            journal.create({
              title: "Gratitude",
              content: "",
              entryType: "gratitude",
              mood: null,
              tags: ["gratitude"],
            });
            go();
          }),
          cmd("weekly", "Weekly Review", CalendarRange, ["review", "week"], () => {
            journal.createReview("weekly");
            toaster.success("Weekly review created");
          }),
          cmd("monthly", "Monthly Review", CalendarRange, ["review", "month"], () => {
            journal.createReview("monthly");
            toaster.success("Monthly review created");
          }),
          cmd("search", "Search Journal", Search, ["find"], go),
          cmd("today", "Open Today's Entry", BookOpen, ["today"], go),
          cmd("summary", "Journal Summary", Sparkles, ["summary", "streak"], () => {
            go();
            openContextPanel(true);
          }),
          cmd("link-project", "Link to Project", Link2, ["link", "project"], () =>
            journal.selected ? go() : need(),
          ),
          cmd("link-decision", "Link to Decision", Link2, ["link", "decision"], () =>
            journal.selected ? go() : need(),
          ),
          cmd("archive", "Archive Entry", Archive, ["archive"], () =>
            journal.selected ? journal.archive(journal.selected.id) : need(),
          ),
        ],
      },
    ];
  }, [router, toaster, journal, openContextPanel]);

  useRegisterGroups(groups);
  return null;
}
