import {
  BarChart3,
  BookOpen,
  Boxes,
  LayoutDashboard,
  Briefcase,
  CalendarClock,
  FolderKanban,
  GraduationCap,
  CalendarDays,
  HeartPulse,
  Inbox,
  ListChecks,
  Milestone,
  MoonStar,
  Settings,
  Bell,
  Sun,
  Target,
  Timer,
  Wallet,
  Workflow,
  Brain,
  Activity,
  Zap,
  Cpu,
  Compass,
  Bot,
  Radar,
  TrendingUp,
  Rocket,
  Plug,
  Fingerprint,
  type LucideIcon,
} from "lucide-react";

/**
 * Navigation model for the OS shell (Sprint 1.3). This is the single source of
 * truth for the sidebar sections, the routes, per-page icons/descriptions, and
 * the Command Center list. No business logic — structure only.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      {
        label: "Chief of Staff",
        href: "/chief",
        icon: Compass,
        description:
          "What should you do right now? Your AI Chief of Staff, grounded in everything.",
      },
      {
        label: "Today",
        href: "/today",
        icon: Sun,
        description: "Your daily briefing and what to do next.",
      },
      {
        label: "Tomorrow",
        href: "/tomorrow",
        icon: MoonStar,
        description: "Close today and plan tomorrow in a guided evening flow.",
      },
      {
        label: "Planner",
        href: "/planner",
        icon: CalendarClock,
        description: "Design your day on a visual timeline.",
      },
      {
        label: "Calendar",
        href: "/calendar",
        icon: CalendarDays,
        description: "Events, meetings, and availability — the source of time.",
      },
      {
        label: "Inbox",
        href: "/inbox",
        icon: Inbox,
        description: "Capture anything now, organize it later.",
      },
      {
        label: "Tasks",
        href: "/tasks",
        icon: ListChecks,
        description: "Your canonical work — priorities, deps, and schedule.",
      },
      {
        label: "Focus",
        href: "/focus",
        icon: Timer,
        description: "Deep work sessions — where the work actually happens.",
      },
    ],
  },
  {
    label: "Work",
    items: [
      {
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
        description: "Goals, milestones, and momentum.",
      },
      {
        label: "College",
        href: "/college",
        icon: GraduationCap,
        description: "Courses, assignments, and exams.",
      },
      {
        label: "Internship",
        href: "/internship",
        icon: Briefcase,
        description: "Work log, meetings, and learnings.",
      },
    ],
  },
  {
    label: "Life",
    items: [
      {
        label: "Journal",
        href: "/journal",
        icon: BookOpen,
        description: "Reflect, track your mood, and grow.",
      },
      {
        label: "Knowledge",
        href: "/knowledge",
        icon: Brain,
        description: "Your second brain — notes, wiki, reading, and memory.",
      },
      {
        label: "Life",
        href: "/life",
        icon: Activity,
        description: "Habits, routines, health, and who you're becoming.",
      },
      {
        label: "Resources",
        href: "/resources",
        icon: Boxes,
        description: "Investments, assets, documents, and the people who matter.",
      },
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "The executive view — how your whole life is progressing.",
      },
      {
        label: "Health",
        href: "/health",
        icon: HeartPulse,
        description: "Workouts, sleep, water, and weight.",
      },
      {
        label: "Finance",
        href: "/finance",
        icon: Wallet,
        description: "Spending, budgets, and savings.",
      },
      {
        label: "Goals",
        href: "/goals",
        icon: Target,
        description: "Long-term outcomes and check-ins.",
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "Signals",
        href: "/signals",
        icon: Radar,
        description: "Event intelligence — risks and opportunities the OS notices for you.",
      },
      {
        label: "Predictions",
        href: "/prediction",
        icon: TrendingUp,
        description:
          "Predictive intelligence — deterministic forecasts of what's likely to happen.",
      },
      {
        label: "Personal Intelligence",
        href: "/adaptation",
        icon: Fingerprint,
        description:
          "What the OS has learned about you — preferences, habits, routines. Evidence-backed, editable, yours.",
      },
      {
        label: "Timeline",
        href: "/timeline",
        icon: Milestone,
        description: "The story of your progress.",
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        description: "Focus, productivity, and trends.",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
        description: "Every reminder and alert your OS surfaces — in one place.",
      },
      {
        label: "Automation",
        href: "/automation",
        icon: Zap,
        description: "Rules that run your life on autopilot.",
      },
      {
        label: "Autopilot",
        href: "/autopilot",
        icon: Rocket,
        description:
          "Proposal-first automation — safe, reversible work you approve before it runs.",
      },
      {
        label: "Connectors",
        href: "/connectors",
        icon: Plug,
        description:
          "External services as normalized event sources — synced, encrypted, read-first.",
      },
      {
        label: "Orchestration",
        href: "/orchestration",
        icon: Workflow,
        description: "Every engine cooperating — one operating system, not twenty apps.",
      },
      {
        label: "AI Settings",
        href: "/ai/settings",
        icon: Bot,
        description: "Providers, keys, budget, and privacy for your conversational Chief.",
      },
      {
        label: "AI Platform",
        href: "/ai",
        icon: Cpu,
        description: "The AI Core Platform — providers, prompts, context, telemetry, and cost.",
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Preferences, data, and account.",
      },
    ],
  },
];

/** Flat list of every nav item. */
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

/** All shell route paths. */
export const NAV_HREFS: string[] = NAV_ITEMS.map((item) => item.href);

/** Look up a nav item by its route (throws in dev if the route is unknown). */
export function getNavItem(href: string): NavItem {
  const item = NAV_ITEMS.find((navItem) => navItem.href === href);
  if (!item) throw new Error(`Unknown nav route: ${href}`);
  return item;
}

/** Find the nav item + section that owns a given pathname. */
export function resolveActive(pathname: string): { section: NavSection; item: NavItem } | null {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return { section, item };
      }
    }
  }
  return null;
}
