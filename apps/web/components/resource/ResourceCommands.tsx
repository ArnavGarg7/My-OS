"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Cake,
  Car,
  FileText,
  Package,
  Plane,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";

/** Resource command group (Sprint 4.3). Registration only. Mount once. */
export function ResourceCommands() {
  const router = useRouter();

  const groups = useMemo<CommandGroup[]>(() => {
    const go = () => router.push("/resources");
    const cmd = (id: string, title: string, icon: LucideIcon, keywords: string[]) => ({
      id: `resource:${id}`,
      title,
      category: "resource",
      icon,
      keywords: ["resource", "own", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        go();
      },
    });

    return [
      {
        id: "resource",
        title: "Resources",
        category: "resource",
        priority: 80,
        commands: [
          cmd("open", "Open Resources", Wallet, ["dashboard", "open", "portfolio"]),
          cmd("add-asset", "Add Asset", Package, ["asset", "add", "own"]),
          cmd("add-investment", "Add Investment", TrendingUp, ["investment", "stock", "add"]),
          cmd("open-portfolio", "Open Portfolio", Wallet, ["portfolio", "net worth"]),
          cmd("review-investments", "Review Investments", TrendingUp, ["review", "investment"]),
          cmd("log-interaction", "Log Interaction", Users, ["interaction", "contact", "log"]),
          cmd("schedule-follow-up", "Schedule Follow-up", UserPlus, ["follow", "up", "contact"]),
          cmd("open-relationship", "Open Relationship", Users, ["relationship", "crm", "people"]),
          cmd("view-birthdays", "View Birthdays", Cake, ["birthday", "anniversary"]),
          cmd("renew-document", "Renew Document", FileText, ["document", "renew", "passport"]),
          cmd("maintenance", "Maintenance Dashboard", Wrench, ["maintenance", "service"]),
          cmd("vehicles", "Open Vehicles", Car, ["vehicle", "car"]),
          cmd("travel-documents", "Travel Documents", Plane, ["travel", "visa", "passport"]),
          cmd("insurance", "Insurance Center", ShieldCheck, ["insurance", "policy", "cover"]),
        ],
      },
    ];
  }, [router]);

  useRegisterGroups(groups);
  return null;
}
