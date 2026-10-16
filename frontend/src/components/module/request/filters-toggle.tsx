"use client";

import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

// Only shown on mobile. On desktop the sidebar is always open.
export function FiltersToggle({ activeCount }: { activeCount: number }) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button variant="outline" className="md:hidden" onClick={toggleSidebar}>
      <SlidersHorizontal className="size-4" />
      Filters
      {activeCount > 0 && (
        <Badge className="h-5 min-w-5 rounded-full px-1.5">{activeCount}</Badge>
      )}
    </Button>
  );
}
