import {
  BarChart3,
  BookOpen,
  Boxes,
  LayoutDashboard,
  Briefcase,
  CalendarClock,
  FolderKanban,
  Users2,
  GraduationCap,
  CalendarDays,
  HeartPulse,
  Inbox,
  LayoutGrid,
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
 * Navigation model for the OS shell (Sprint 1.3; reorganised for V2 Stage 1).
 * Single source of truth for the sidebar sections, routes, per-page
 * icons/descriptions and the Command Center (⌘K) list. No business logic.
 *
 * The five sections mirror how My OS is meant to be understood:
 *   PRIMARY       the surfaces you operate from every day
 *   WORK / LIFE   where your information and activity actually live
 *   INTELLIGENCE  what My OS does to interpret it all and help you
 *   SYSTEM        where My OS is configured and operated
 *
 * Routes the Stitch redesign did not name are kept and folded into their
 * nearest section as `secondary: true` — visually quieter, still one click away.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Folded-in V1 route — rendered below the section's core destinations, dimmer. */
  secondary?: boolean;
}

export interface NavSection {
  label: string;
  /** One line on what this section is for — shown on the section header. */
  blurb: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Primary",
    blurb: "The surfaces you operate from every day.",
    items: [
      {
        label: "Command Center",
        href: "/command-center",
        icon: LayoutGrid,
        description: "Understand your life at a glance — context, next action, and system pulse.",
      },
      {
        label: "Today",
        href: "/today",
        icon: Sun,
        description: "Operate your day — current focus, next event, and what to do now.",
      },
      {
        label: "Tomorrow",
        href: "/tomorrow",
        icon: MoonStar,
        description: "Close today and plan tomorrow in a guided evening flow.",
      },
      {
        label: "Tasks",
        href: "/tasks",
        icon: ListChecks,
        description: "Your canonical work — priorities, deps, energy, and schedule.",
      },
      {
        label: "Calendar",
        href: "/calendar",
        icon: CalendarDays,
        description: "How your time is being used — commitments, focus blocks, and conflicts.",
      },
      {
        label: "Focus",
        href: "/focus",
        icon: Timer,
        description: "Deep work sessions — where the work actually happens.",
      },
      {
        label: "Planner",
        href: "/planner",
        icon: CalendarClock,
        description: "Design your day on a visual timeline.",
        secondary: true,
      },
      {
        label: "Inbox",
        href: "/inbox",
        icon: Inbox,
        description: "Capture anything now, organize it later.",
        secondary: true,
      },
    ],
  },
  {
    label: "Work",
    blurb: "Your commitments and the projects behind them.",
    items: [
      {
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
        description: "Goals, milestones, and momentum.",
      },
      {
        label: "Collaboration",
        href: "/collaboration",
        icon: Users2,
        description: "People, shared work, and discussions.",
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
    blurb: "Where your information and activity live.",
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
      {
        label: "Health",
        href: "/health",
        icon: HeartPulse,
        description: "Workouts, sleep, water, and weight.",
        secondary: true,
      },
      {
        label: "Resources",
        href: "/resources",
        icon: Boxes,
        description: "Investments, assets, documents, and the people who matter.",
        secondary: true,
      },
    ],
  },
  {
    label: "Intelligence",
    blurb: "What My OS notices, predicts, and understands about you.",
    items: [
      {
        label: "Chief of Staff",
        href: "/chief",
        icon: Compass,
        description: "An executive layer over your life — contextual, explainable recommendations.",
      },
      {
        label: "Signals",
        href: "/signals",
        icon: Radar,
        description: "What is happening — risks and opportunities the OS notices for you.",
      },
      {
        label: "Predictions",
        href: "/prediction",
        icon: TrendingUp,
        description: "What is likely to happen — deterministic forecasts, explained.",
      },
      {
        label: "Personal Intelligence",
        href: "/adaptation",
        icon: Fingerprint,
        description: "What the OS understands about you — preferences, habits, routines.",
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        description: "How you are actually doing — focus, productivity, and trends.",
      },
      {
        label: "Timeline",
        href: "/timeline",
        icon: Milestone,
        description: "The story of your progress.",
        secondary: true,
      },
      {
        label: "Life Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "The executive view — how your whole life is progressing.",
        secondary: true,
      },
    ],
  },
  {
    label: "System",
    blurb: "Where My OS is configured and operated.",
    items: [
      {
        label: "Connectors",
        href: "/connectors",
        icon: Plug,
        description:
          "External services as normalized event sources — synced, encrypted, read-first.",
      },
      {
        label: "Automation",
        href: "/automation",
        icon: Zap,
        description: "Rules that run your life on autopilot.",
      },
      {
        label: "AI Settings",
        href: "/ai/settings",
        icon: Bot,
        description: "Providers, keys, budget, and privacy for your conversational Chief.",
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Preferences, data, and account.",
      },
      {
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
        description: "Every reminder and alert your OS surfaces — in one place.",
        secondary: true,
      },
      {
        label: "Autopilot",
        href: "/autopilot",
        icon: Rocket,
        description:
          "Proposal-first automation — safe, reversible work you approve before it runs.",
        secondary: true,
      },
      {
        label: "Orchestration",
        href: "/orchestration",
        icon: Workflow,
        description: "Every engine cooperating — one operating system, not twenty apps.",
        secondary: true,
      },
      {
        label: "AI Platform",
        href: "/ai",
        icon: Cpu,
        description: "The AI Core Platform — providers, prompts, context, telemetry, and cost.",
        secondary: true,
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
  let best: { section: NavSection; item: NavItem } | null = null;
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        // Prefer the most specific (longest) matching href, so /ai/settings wins
        // over /ai.
        if (!best || item.href.length > best.item.href.length) best = { section, item };
      }
    }
  }
  return best;
}
