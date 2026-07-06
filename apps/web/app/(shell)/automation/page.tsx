import { PagePlaceholder } from "@/components/shell/page-placeholder";
import { getNavItem } from "@/lib/shell/nav";

export const metadata = { title: "Automation" };

export default function AutomationPage() {
  return <PagePlaceholder item={getNavItem("/automation")} />;
}
