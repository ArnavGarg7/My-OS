"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Drawer, DrawerContent, DrawerTitle } from "@myos/ui";
import { useShellStore } from "@/lib/shell/store";
import { SidebarContent } from "./sidebar-content";

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
        <div className="flex h-12 shrink-0 items-center gap-2 px-3">
          <span
            aria-hidden
            className="bg-elevated text-accent flex size-7 items-center justify-center rounded-lg font-mono"
          >
            ▮
          </span>
          <DrawerTitle className="text-heading-s font-semibold">My OS</DrawerTitle>
        </div>
        <SidebarContent collapsed={false} onNavigate={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  );
}
