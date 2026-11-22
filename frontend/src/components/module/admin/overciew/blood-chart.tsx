"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { bloodLabel } from "@/lib/blood";
import type { AdminOverview } from "@/service/overview.service";

const config = {
  demand: { label: "Requests (8 weeks)", color: "var(--chart-1)" },
  supply: { label: "Active donors", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function BloodChart({ data }: { data: AdminOverview["blood"] }) {
  const rows = data.map((b) => ({ ...b, type: bloodLabel(b.bloodType) }));

  return (
    <ChartContainer config={config} className="h-72 w-full">
      <BarChart data={rows} margin={{ left: 0, right: 0, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 4" />
        <XAxis
          dataKey="type"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          yAxisId="demand"
          orientation="left"
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={28}
        />
        <YAxis
          yAxisId="supply"
          orientation="right"
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={28}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          yAxisId="demand"
          dataKey="demand"
          fill="var(--color-demand)"
          radius={4}
        />
        <Bar
          yAxisId="supply"
          dataKey="supply"
          fill="var(--color-supply)"
          radius={4}
        />
      </BarChart>
    </ChartContainer>
  );
}
