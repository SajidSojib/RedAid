"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { bloodLabel } from "@/lib/blood";
import type { BankOverview } from "@/service/overview.service";

const LOW = 5;

const config = {
  units: { label: "Bags in stock", color: "var(--primary)" },
} satisfies ChartConfig;

const fillFor = (units: number) =>
  units === 0
    ? "var(--muted)"
    : units < LOW
      ? "color-mix(in oklab, var(--primary) 45%, transparent)"
      : "var(--primary)";

export function StockChart({
  items,
}: {
  items: BankOverview["stock"]["items"];
}) {
  const rows = items.map((i) => ({
    type: bloodLabel(i.bloodType),
    units: i.unitsAvailable,
  }));

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 4" />
        <XAxis
          dataKey="type"
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
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ReferenceLine
          y={LOW}
          stroke="var(--muted-foreground)"
          strokeOpacity={0.5}
          strokeDasharray="4 4"
          label={{
            value: "Low",
            position: "insideTopRight",
            fontSize: 10,
            fill: "var(--muted-foreground)",
          }}
        />
        <Bar dataKey="units" radius={6}>
          {rows.map((r) => (
            <Cell key={r.type} fill={fillFor(r.units)} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
