"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { BankOverview } from "@/service/overview.service";

const config = {
  fulfilled: { label: "Completed", color: "var(--chart-1)" },
  rejected: { label: "Rejected", color: "var(--destructive)" },
} satisfies ChartConfig;

const weekLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

export function TrendChart({ data }: { data: BankOverview["weekly"] }) {
  const rows = data.map((w) => ({ ...w, week: weekLabel(w.weekStart) }));

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <AreaChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="bank-fulfilled" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-fulfilled)"
              stopOpacity={0.35}
            />
            <stop
              offset="100%"
              stopColor="var(--color-fulfilled)"
              stopOpacity={0}
            />
          </linearGradient>
          <linearGradient id="bank-rejected" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-rejected)"
              stopOpacity={0.2}
            />
            <stop
              offset="100%"
              stopColor="var(--color-rejected)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
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
        <Area
          dataKey="rejected"
          type="monotone"
          stroke="var(--color-rejected)"
          strokeWidth={2}
          fill="url(#bank-rejected)"
        />
        <Area
          dataKey="fulfilled"
          type="monotone"
          stroke="var(--color-fulfilled)"
          strokeWidth={3}
          fill="url(#bank-fulfilled)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
