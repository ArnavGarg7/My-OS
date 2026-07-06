import { PagePlaceholder } from "@/components/shell/page-placeholder";
import { getNavItem } from "@/lib/shell/nav";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return <PagePlaceholder item={getNavItem("/analytics")} />;
}
