"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AdminOverview } from "@/service/overview.service";

const config = {
  completed: { label: "Completed", color: "var(--chart-2)" },
  open: { label: "Open", color: "var(--chart-1)" },
  fulfilled: { label: "All bags claimed", color: "var(--chart-3)" },
  cancelled: { label: "Cancelled", color: "var(--chart-5)" },
  expired: { label: "Expired", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function OutcomesChart({
  requests,
}: {
  requests: AdminOverview["counts"]["requests"];
}) {
  const rows = [
    { key: "completed", value: requests.COMPLETED },
    { key: "open", value: requests.OPEN },
    { key: "fulfilled", value: requests.FULFILLED },
    { key: "cancelled", value: requests.CANCELLED },
    { key: "expired", value: requests.EXPIRED },
  ].map((r) => ({ ...r, fill: `var(--color-${r.key})` }));

  const total = rows.reduce((s, r) => s + r.value, 0);
  const closed = requests.COMPLETED + requests.CANCELLED + requests.EXPIRED;
  const rate =
    closed === 0 ? null : Math.round((requests.COMPLETED / closed) * 100);

  return (
    <div className="space-y-4">
      <div className="relative mx-auto h-44 w-44">
        <ChartContainer config={config} className="h-full w-full">
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent hideLabel nameKey="key" />}
            />
            <Pie
              data={
                total === 0
                  ? [{ key: "none", value: 1, fill: "var(--muted)" }]
                  : rows
              }
              dataKey="value"
              nameKey="key"
              innerRadius={58}
              outerRadius={80}
              strokeWidth={2}
            />
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl leading-none font-bold tabular-nums">
            {rate === null ? "–" : `${rate}%`}
          </span>
          <span className="text-[11px] text-muted-foreground">completed</span>
        </div>
      </div>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 rounded-full"
              style={{
                background: r.fill.replace(
                  "var(--color-" + r.key + ")",
                  config[r.key as keyof typeof config].color,
                ),
              }}
            />
            <span className="flex-1 text-muted-foreground">
              {config[r.key as keyof typeof config].label}
            </span>
            <span className="font-semibold tabular-nums">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
