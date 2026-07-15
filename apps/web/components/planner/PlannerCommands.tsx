"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  RefreshCw,
  Wand2,
  Trash2,
  Lock,
  LockOpen,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  CalendarClock,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { currentBlock } from "@myos/core/planner";
import { useModal, useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { usePlanner } from "./use-planner";
import { PlannerConflictDialog } from "./PlannerConflictDialog";

/** Planner command group (Sprint 2.6). Registration only. Mount once in shell. */
export function PlannerCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const { open } = useModal();
  const p = usePlanner();

  const groups = useMemo<CommandGroup[]>(() => {
    const needBlock = () => toaster.info("Select a block first.");
    const withBlock = (fn: (id: string) => void) => () =>
      p.selected ? fn(p.selected.id) : needBlock();

    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void,
    ) => ({
      id: `planner:${id}`,
      title,
      category: "planner",
      icon,
      keywords: ["planner", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    return [
      {
        id: "planner",
        title: "Planner",
        category: "planner",
        priority: 94,
        commands: [
          cmd("generate", "Generate Plan", Sparkles, ["generate", "plan"], () => p.generate()),
          cmd("regenerate", "Regenerate", RefreshCw, ["regenerate", "rebuild"], () => p.generate()),
          cmd("optimize", "Optimize Day", Wand2, ["optimize"], () => p.optimize()),
          cmd("clear", "Clear Plan", Trash2, ["clear", "reset"], () => p.clear()),
          cmd("lock", "Lock Block", Lock, ["lock"], () => withBlock((id) => p.lock(id))()),
          cmd("unlock", "Unlock Block", LockOpen, ["unlock"], () =>
            withBlock((id) => p.unlock(id))(),
          ),
          cmd("earlier", "Move Earlier", ChevronUp, ["move", "earlier"], () =>
            withBlock((id) => p.move(id, "earlier"))(),
          ),
          cmd("later", "Move Later", ChevronDown, ["move", "later"], () =>
            withBlock((id) => p.move(id, "later"))(),
          ),
          cmd("conflicts", "Resolve Conflicts", AlertTriangle, ["conflicts"], () =>
            open(() => <PlannerConflictDialog conflicts={p.conflicts} />, {
              title: "Conflicts",
              size: "md",
            }),
          ),
          cmd("open", "Open Timeline", CalendarClock, ["open", "timeline"], () =>
            router.push("/planner"),
          ),
          cmd("now", "Jump To Now", Clock, ["now", "current"], () => {
            const cur = currentBlock(p.blocks, new Date());
            if (cur) {
              p.select(cur.id);
              router.push("/planner");
            } else toaster.info("Nothing scheduled right now.");
          }),
        ],
      },
    ];
  }, [router, toaster, open, p]);

  useRegisterGroups(groups);
  return null;
}
