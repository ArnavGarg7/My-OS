"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Brain, Clock, Fingerprint, Gauge, ListChecks, type LucideIcon } from "lucide-react";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";

/**
 * Personal Intelligence command group (Stage 5). Lets the Omni Launcher answer
 * "what does My OS know about me?" and jump into the personalization surface —
 * navigate-only, so it registers reliably and the same capability is reusable by a
 * future voice interface. Mirrors the KnowledgeCommands registration shape.
 */
export function AdaptationCommands() {
  const router = useRouter();

  const groups = useMemo<CommandGroup[]>(() => {
    const go = () => router.push("/adaptation");
    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void = go,
    ) => ({
      id: `adaptation:${id}`,
      title,
      category: "intelligence",
      icon,
      keywords: ["personal", "personalization", "about me", "learned", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    return [
      {
        id: "adaptation",
        title: "Personal Intelligence",
        category: "intelligence",
        priority: 78,
        commands: [
          cmd("open", "What does My OS know about me?", Fingerprint, ["profile", "knows", "open"]),
          cmd("patterns", "Show my work & focus patterns", Clock, [
            "patterns",
            "focus",
            "work",
            "hours",
          ]),
          cmd("estimation", "How accurate are my estimates?", Gauge, [
            "estimate",
            "estimation",
            "actual",
            "accuracy",
          ]),
          cmd("preferences", "What preferences are you using?", Brain, ["preferences", "settings"]),
          cmd(
            "postponing",
            "What have I been postponing?",
            ListChecks,
            ["postpone", "overdue", "slipping", "behind"],
            () => router.push("/tasks"),
          ),
        ],
      },
    ];
  }, [router]);

  useRegisterGroups(groups);
  return null;
}
