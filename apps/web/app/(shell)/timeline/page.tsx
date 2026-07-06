import { PagePlaceholder } from "@/components/shell/page-placeholder";
import { getNavItem } from "@/lib/shell/nav";

export const metadata = { title: "Timeline" };

export default function TimelinePage() {
  return <PagePlaceholder item={getNavItem("/timeline")} />;
}
