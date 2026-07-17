"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Brain,
  FileText,
  FlaskConical,
  GraduationCap,
  Layers,
  Network,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useShellStore } from "@/lib/shell/store";

/** Knowledge command group (Sprint 4.1). Registration only. Mount once. */
export function KnowledgeCommands() {
  const router = useRouter();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);

  const groups = useMemo<CommandGroup[]>(() => {
    const go = () => router.push("/knowledge");
    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void,
    ) => ({
      id: `knowledge:${id}`,
      title,
      category: "knowledge",
      icon,
      keywords: ["knowledge", "second brain", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    return [
      {
        id: "knowledge",
        title: "Knowledge",
        category: "knowledge",
        priority: 82,
        commands: [
          cmd("open", "Open Knowledge Center", Brain, ["open", "center"], go),
          cmd("new-note", "New Note", FileText, ["note", "new"], go),
          cmd("new-wiki", "New Wiki Page", Network, ["wiki", "new"], go),
          cmd("new-book", "New Book", BookOpen, ["book", "reading"], go),
          cmd("new-course", "New Course", GraduationCap, ["course", "learning"], go),
          cmd("search", "Search Knowledge", Search, ["search", "find"], go),
          cmd("graph", "Open Graph", Network, ["graph", "map"], go),
          cmd("review", "Review Flashcards", Layers, ["review", "flashcards"], go),
          cmd("reading", "Continue Reading", BookOpen, ["reading", "continue"], go),
          cmd("research", "Continue Research", FlaskConical, ["research"], go),
          cmd("daily", "Daily Review", Sparkles, ["daily", "review"], go),
          cmd("statistics", "Knowledge Statistics", BarChart3, ["stats"], go),
          cmd("memory", "Memory Review", Sparkles, ["memory", "resurface"], () => {
            go();
            openContextPanel(true);
          }),
        ],
      },
    ];
  }, [router, openContextPanel]);

  useRegisterGroups(groups);
  return null;
}
