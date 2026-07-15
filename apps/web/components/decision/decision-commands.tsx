"use client";

import { useMemo } from "react";
import { Check, Clock, HelpCircle, History, X } from "lucide-react";
import { Button } from "@myos/ui";
import type { DeferOption } from "@myos/core/decision";
import { useModal, useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useDecisions } from "./use-decisions";
import { DecisionHistory } from "./DecisionHistory";
import { DecisionExplanation } from "./DecisionExplanation";

const DEFER_CHOICES: { option: DeferOption; label: string }[] = [
  { option: "15m", label: "In 15 minutes" },
  { option: "30m", label: "In 30 minutes" },
  { option: "1h", label: "In 1 hour" },
  { option: "tomorrow", label: "Tomorrow" },
];

/** Decision command group (Sprint 2.3). Registration only. Mount once in shell. */
export function DecisionCommands() {
  const { open } = useModal();
  const toaster = useToaster();
  const { current, decisions, accept, dismiss, defer } = useDecisions();

  const groups = useMemo<CommandGroup[]>(() => {
    const noCurrent = () => toaster.info("No pending decision right now.");

    const openDefer = () => {
      if (!current) return noCurrent();
      open(
        (close) => (
          <div className="flex flex-col gap-2 pt-2">
            {DEFER_CHOICES.map((choice) => (
              <Button
                key={choice.option}
                variant="secondary"
                className="justify-start"
                onClick={() => {
                  defer(current.id, choice.option);
                  close();
                }}
              >
                {choice.label}
              </Button>
            ))}
          </div>
        ),
        { title: "Defer decision", size: "sm" },
      );
    };

    const openHistory = () =>
      open(() => <DecisionHistory decisions={decisions} />, {
        title: "Decision History",
        size: "md",
      });

    const openExplain = () => {
      if (!current) return noCurrent();
      open(() => <DecisionExplanation decisionId={current.id} />, {
        title: "Why this decision?",
        size: "md",
      });
    };

    return [
      {
        id: "decision",
        title: "Decision",
        category: "decision",
        priority: 97,
        commands: [
          {
            id: "decision:accept",
            title: "Accept Current Decision",
            category: "decision",
            icon: Check,
            keywords: ["accept", "decision", "yes"],
            execute: (ctx) => {
              ctx.close();
              if (current) accept(current.id);
              else noCurrent();
            },
          },
          {
            id: "decision:dismiss",
            title: "Dismiss Current Decision",
            category: "decision",
            icon: X,
            keywords: ["dismiss", "decision", "no"],
            execute: (ctx) => {
              ctx.close();
              if (current) dismiss(current.id);
              else noCurrent();
            },
          },
          {
            id: "decision:defer",
            title: "Defer Current Decision",
            category: "decision",
            icon: Clock,
            keywords: ["defer", "later", "decision"],
            execute: (ctx) => {
              ctx.close();
              openDefer();
            },
          },
          {
            id: "decision:history",
            title: "Show Decision History",
            category: "decision",
            icon: History,
            keywords: ["history", "decisions", "log"],
            execute: (ctx) => {
              ctx.close();
              openHistory();
            },
          },
          {
            id: "decision:explain",
            title: "Explain Current Decision",
            category: "decision",
            icon: HelpCircle,
            keywords: ["explain", "why", "reason"],
            execute: (ctx) => {
              ctx.close();
              openExplain();
            },
          },
        ],
      },
    ];
  }, [open, toaster, current, decisions, accept, dismiss, defer]);

  useRegisterGroups(groups);
  return null;
}
