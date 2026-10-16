"use client";

import type { CSSProperties, ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

const noop = () => {};

export function RequestsShell({ children }: { children: ReactNode }) {
  return (
    // `open` is locked: the filters stay open on desktop. Mobile uses its own drawer state.
    <SidebarProvider
      open
      onOpenChange={noop}
      className="min-h-[calc(100svh-var(--header-height))]"
      style={{ "--sidebar-width": "18.5rem" } as CSSProperties}
    >
      {children}
    </SidebarProvider>
  );
}