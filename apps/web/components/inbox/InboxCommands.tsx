"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowRightLeft,
  Inbox as InboxIcon,
  Lightbulb,
  Search,
  CheckSquare,
  StickyNote,
} from "lucide-react";
import type { CaptureType } from "@myos/core/inbox";
import { useToaster } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { trpc } from "@/lib/trpc/client";
import { useInbox } from "./use-inbox";

/** Inbox command group (Sprint 2.4). Registration only. Mount once in shell. */
export function InboxCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const setQuickAddOpen = useShellStore((s) => s.setQuickAddOpen);
  const setQuickAddType = useShellStore((s) => s.setQuickAddType);
  const { selected, archive } = useInbox();
  const utils = trpc.useUtils();
  const convert = trpc.task.convertInbox.useMutation({
    onSuccess: (task) => {
      utils.inbox.list.invalidate();
      utils.task.list.invalidate();
      toaster.success("Converted to task", task.title);
    },
    onError: (e) => toaster.error("Couldn't convert", e.message),
  });

  const groups = useMemo<CommandGroup[]>(() => {
    const capture = (type: CaptureType) => {
      setQuickAddType(type);
      setQuickAddOpen(true);
    };

    return [
      {
        id: "inbox",
        title: "Inbox",
        category: "inbox",
        priority: 96,
        commands: [
          {
            id: "inbox:capture-note",
            title: "Capture Note",
            category: "inbox",
            icon: StickyNote,
            keywords: ["capture", "note", "inbox"],
            execute: (ctx) => {
              ctx.close();
              capture("note");
            },
          },
          {
            id: "inbox:capture-idea",
            title: "Capture Idea",
            category: "inbox",
            icon: Lightbulb,
            keywords: ["capture", "idea", "inbox"],
            execute: (ctx) => {
              ctx.close();
              capture("idea");
            },
          },
          {
            id: "inbox:capture-task",
            title: "Capture Task",
            category: "inbox",
            icon: CheckSquare,
            keywords: ["capture", "task", "inbox"],
            execute: (ctx) => {
              ctx.close();
              capture("task");
            },
          },
          {
            id: "inbox:open",
            title: "Open Inbox",
            category: "inbox",
            icon: InboxIcon,
            keywords: ["inbox", "open", "captures"],
            execute: (ctx) => {
              ctx.close();
              router.push("/inbox");
            },
          },
          {
            id: "inbox:archive-selected",
            title: "Archive Selected",
            category: "inbox",
            icon: Archive,
            keywords: ["archive", "inbox", "selected"],
            execute: (ctx) => {
              ctx.close();
              if (selected) archive(selected.id);
              else toaster.info("No inbox item selected.");
            },
          },
          {
            id: "inbox:convert-task",
            title: "Convert to Task",
            category: "inbox",
            icon: ArrowRightLeft,
            keywords: ["convert", "task", "inbox", "organize"],
            execute: (ctx) => {
              ctx.close();
              if (selected) convert.mutate({ inboxId: selected.id });
              else toaster.info("No inbox item selected.");
            },
          },
          {
            id: "inbox:search",
            title: "Search Inbox",
            category: "inbox",
            icon: Search,
            keywords: ["search", "inbox", "find"],
            execute: (ctx) => {
              ctx.close();
              router.push("/inbox");
            },
          },
        ],
      },
    ];
  }, [router, toaster, setQuickAddOpen, setQuickAddType, selected, archive, convert]);

  useRegisterGroups(groups);
  return null;
}
