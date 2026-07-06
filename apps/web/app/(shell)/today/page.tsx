import { PagePlaceholder } from "@/components/shell/page-placeholder";
import { getNavItem } from "@/lib/shell/nav";

export const metadata = { title: "Today" };

export default function TodayPage() {
  return <PagePlaceholder item={getNavItem("/today")} />;
}
