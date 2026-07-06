import { PagePlaceholder } from "@/components/shell/page-placeholder";
import { getNavItem } from "@/lib/shell/nav";

export const metadata = { title: "Health" };

export default function HealthPage() {
  return <PagePlaceholder item={getNavItem("/health")} />;
}
