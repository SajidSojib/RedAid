"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AdminOverview } from "@/service/overview.service";

const config = {
  donations: { label: "Donations", color: "var(--chart-1)" },
  requests: { label: "Requests", color: "var(--chart-4)" },
  signups: { label: "New donors", color: "var(--chart-2)" },
} satisfies ChartConfig;

const weekLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

export function GrowthChart({ data }: { data: AdminOverview["weekly"] }) {
  const rows = data.map((w) => ({ ...w, week: weekLabel(w.weekStart) }));

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <LineChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 4" />
        <XAxis
          dataKey="week"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={28}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="requests"
          type="monotone"
          stroke="var(--color-requests)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="signups"
          type="monotone"
          stroke="var(--color-signups)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="donations"
          type="monotone"
          stroke="var(--color-donations)"
          strokeWidth={3}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
