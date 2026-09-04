"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Share2, UserPlus, Users2, type LucideIcon } from "lucide-react";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";

/**
 * Collaboration command group (Stage 7). Navigate-only Omni commands so collaboration is
 * reachable from the launcher — and, being UI-independent, reusable by a future voice
 * interface (voice → action → collaboration operation). Mirrors the KnowledgeCommands shape.
 */
export function CollaborationCommands() {
  const router = useRouter();

  const groups = useMemo<CommandGroup[]>(() => {
    const go = () => router.push("/collaboration");
    const cmd = (id: string, title: string, icon: LucideIcon, keywords: string[]) => ({
      id: `collaboration:${id}`,
      title,
      category: "work",
      icon,
      keywords: ["collaborate", "people", "share", "team", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        go();
      },
    });
    return [
      {
        id: "collaboration",
        title: "Collaboration",
        category: "work",
        priority: 70,
        commands: [
          cmd("open", "Open Collaboration", Users2, ["open", "collaboration"]),
          cmd("people", "Manage people", UserPlus, ["people", "collaborators", "add"]),
          cmd("share", "Share a project", Share2, ["share", "project", "invite"]),
          cmd("discussions", "Show discussions", MessageSquare, [
            "discussion",
            "messages",
            "conversations",
          ]),
        ],
      },
    ];
  }, [router]);

  useRegisterGroups(groups);
  return null;
}
