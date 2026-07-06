import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarClock,
  FolderKanban,
  GraduationCap,
  HeartPulse,
  Inbox,
  Milestone,
  Settings,
  Sun,
  Target,
  Wallet,
  Zap,
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
        label: "Today",
        href: "/today",
        icon: Sun,
        description: "Your daily briefing and what to do next.",
      },
      {
        label: "Planner",
        href: "/planner",
        icon: CalendarClock,
        description: "Design your day on a visual timeline.",
      },
      {
        label: "Inbox",
        href: "/inbox",
        icon: Inbox,
        description: "Capture anything now, organize it later.",
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
        label: "Automation",
        href: "/automation",
        icon: Zap,
        description: "Rules that run your life on autopilot.",
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
