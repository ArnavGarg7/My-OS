import { PagePlaceholder } from "@/components/shell/page-placeholder";
import { getNavItem } from "@/lib/shell/nav";

export const metadata = { title: "Internship" };

export default function InternshipPage() {
  return <PagePlaceholder item={getNavItem("/internship")} />;
}
