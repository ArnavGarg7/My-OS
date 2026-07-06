import { PagePlaceholder } from "@/components/shell/page-placeholder";
import { getNavItem } from "@/lib/shell/nav";

export const metadata = { title: "College" };

export default function CollegePage() {
  return <PagePlaceholder item={getNavItem("/college")} />;
}
