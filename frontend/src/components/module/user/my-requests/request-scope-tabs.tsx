"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RequestScopeTabs({ scope }: { scope: "active" | "history" }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Tabs
      value={scope}
      onValueChange={(value) =>
        router.replace(
          value === "history" ? `${pathname}?scope=history` : pathname,
          {
            scroll: false,
          },
        )
      }
    >
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
