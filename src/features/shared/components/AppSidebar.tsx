"use client";

import { SidebarContent } from "./SidebarContent";

/**
 * Desktop-only (`lg+`) sticky sidebar shell. Renders the shared
 * `SidebarContent` inside an `<aside>`; the mobile counterpart is the
 * drawer in `MobileTopBar`.
 */
export function AppSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 bg-muted paper border-r border-border h-dvh sticky top-0 overflow-hidden">
      <SidebarContent />
    </aside>
  );
}
