"use client";

import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function Count({ value }: { value: number }) {
  if (value === 0) return null;
  return (
    <Badge className="ml-1.5 h-5 min-w-5 rounded-full px-1.5 text-xs">
      {value}
    </Badge>
  );
}

export default function OfferScopeTabs({
  scope,
  pending,
  accepted,
}: {
  scope: string;
  pending: number;
  accepted: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Tabs
      value={scope}
      onValueChange={(value) =>
        router.replace(
          value === "pending" ? pathname : `${pathname}?scope=${value}`,
          {
            scroll: false,
          },
        )
      }
    >
      <TabsList>
        <TabsTrigger value="pending">
          Pending <Count value={pending} />
        </TabsTrigger>
        <TabsTrigger value="accepted">
          Accepted <Count value={accepted} />
        </TabsTrigger>
        <TabsTrigger value="past">Past</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
