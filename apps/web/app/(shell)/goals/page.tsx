import { PagePlaceholder } from "@/components/shell/page-placeholder";
import { getNavItem } from "@/lib/shell/nav";

export const metadata = { title: "Goals" };

export default function GoalsPage() {
  return <PagePlaceholder item={getNavItem("/goals")} />;
}
