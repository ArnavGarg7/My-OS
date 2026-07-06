import { PagePlaceholder } from "@/components/shell/page-placeholder";
import { getNavItem } from "@/lib/shell/nav";

export const metadata = { title: "Journal" };

export default function JournalPage() {
  return <PagePlaceholder item={getNavItem("/journal")} />;
}
