import { PagePlaceholder } from "@/components/shell/page-placeholder";
import { getNavItem } from "@/lib/shell/nav";

export const metadata = { title: "Projects" };

export default function ProjectsPage() {
  return <PagePlaceholder item={getNavItem("/projects")} />;
}
