import { PagePlaceholder } from "@/components/shell/page-placeholder";
import { getNavItem } from "@/lib/shell/nav";

export const metadata = { title: "Inbox" };

export default function InboxPage() {
  return <PagePlaceholder item={getNavItem("/inbox")} />;
}
