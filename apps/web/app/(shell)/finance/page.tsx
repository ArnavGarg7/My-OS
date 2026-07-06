import { PagePlaceholder } from "@/components/shell/page-placeholder";
import { getNavItem } from "@/lib/shell/nav";

export const metadata = { title: "Finance" };

export default function FinancePage() {
  return <PagePlaceholder item={getNavItem("/finance")} />;
}
