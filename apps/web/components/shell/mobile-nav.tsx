"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Drawer, DrawerContent, DrawerTitle } from "@myos/ui";
import { useShellStore } from "@/lib/shell/store";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarContent } from "./sidebar-content";
import { OmniLauncherButton } from "./omni-launcher-button";

/** Mobile navigation drawer (below md). Closes on route change. */
export function MobileNav() {
  const open = useShellStore((state) => state.mobileNavOpen);
  const setOpen = useShellStore((state) => state.setMobileNavOpen);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent side="left" className="w-72 gap-0 p-0">
        <div className="flex h-14 shrink-0 items-center px-3">
          <DrawerTitle className="sr-only">My OS navigation</DrawerTitle>
          <SidebarBrand />
        </div>
        <div className="px-2 pb-2">
          <OmniLauncherButton />
        </div>
        <SidebarContent collapsed={false} onNavigate={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  );
}
