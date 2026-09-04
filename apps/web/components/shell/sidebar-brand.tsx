import { Emblem, Text } from "@myos/ui";

/**
 * Shell identity block — the Core Emblem plus the product name. Shared by the
 * desktop sidebar header and the mobile nav drawer so the mark is consistent
 * everywhere the shell appears.
 */
export function SidebarBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Emblem size={26} />
      {collapsed ? null : (
        <div className="flex min-w-0 flex-col leading-tight">
          <Text variant="heading-s" className="truncate font-semibold tracking-tight">
            My OS
          </Text>
          <Text variant="caption" tone="subtle" className="truncate">
            Personal OS
          </Text>
        </div>
      )}
    </div>
  );
}
