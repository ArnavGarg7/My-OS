import { PagePlaceholder } from "@/components/shell/page-placeholder";
import { getNavItem } from "@/lib/shell/nav";

export const metadata = { title: "Planner" };

export default function PlannerPage() {
  return <PagePlaceholder item={getNavItem("/planner")} />;
}
