"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Landmark,
  PiggyBank,
  Plus,
  Receipt,
  Repeat,
  Search,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useShellStore } from "@/lib/shell/store";
import { useFinance } from "./use-finance";

/** Finance command group (Sprint 2.11). Registration only. Mount once in shell. */
export function FinanceCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const finance = useFinance();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);

  const groups = useMemo<CommandGroup[]>(() => {
    const go = () => router.push("/finance");
    const needAccount = () => toaster.info("Select an account first.");

    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void,
    ) => ({
      id: `finance:${id}`,
      title,
      category: "finance",
      icon,
      keywords: ["finance", "money", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    return [
      {
        id: "finance",
        title: "Finance",
        category: "finance",
        priority: 88,
        commands: [
          cmd("add", "Add Transaction", Plus, ["transaction", "expense"], go),
          cmd("transfer", "Transfer Funds", ArrowLeftRight, ["transfer"], go),
          cmd("budget", "New Budget", Receipt, ["budget"], go),
          cmd("subscription", "New Subscription", Repeat, ["subscription"], go),
          cmd("income", "Record Income", ArrowDownLeft, ["income"], () =>
            finance.selectedAccountId ? go() : needAccount(),
          ),
          cmd("expense", "Record Expense", ArrowUpRight, ["expense"], () =>
            finance.selectedAccountId ? go() : needAccount(),
          ),
          cmd("accounts", "Open Accounts", Landmark, ["accounts"], go),
          cmd("forecast", "View Forecast", TrendingUp, ["forecast"], () => {
            go();
            openContextPanel(true);
          }),
          cmd("savings", "Open Savings", PiggyBank, ["savings", "goal"], go),
          cmd("search", "Search Transactions", Search, ["search"], go),
          cmd("summary", "Finance Summary", Wallet, ["summary"], () => {
            go();
            openContextPanel(true);
          }),
        ],
      },
    ];
  }, [router, toaster, finance, openContextPanel]);

  useRegisterGroups(groups);
  return null;
}
