"use client";

import { useState, useTransition } from "react";
import { Loader, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getReportSummary } from "@/action/report.action";
import { cn } from "@/lib/utils";
import type {
  ReportSummary as Summary,
  ReportTarget,
} from "@/service/report.service";

const SEVERITY = {
  low: "bg-muted text-muted-foreground ring-border",
  medium:
    "bg-amber-500/10 text-amber-600 ring-amber-500/30 dark:text-amber-400",
  high: "bg-destructive/10 text-destructive ring-destructive/30",
} as const;

export function ReportSummary({
  target,
  total,
}: {
  target: ReportTarget;
  total: number;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const { data, error } = await getReportSummary(target);
      if (error || !data) {
        toast.error(error?.message ?? "Couldn't create the summary");
        return;
      }
      setSummary(data);
    });

  if (!summary) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed bg-muted/30 p-3">
        <p className="text-sm text-muted-foreground">
          {total} report{total === 1 ? "" : "s"}. Let AI sum them up.
        </p>
        <Button size="sm" onClick={run} disabled={pending}>
          {pending ? (
            <Loader className="animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Summarize
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" />
          AI summary
        </p>
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className={cn(
              "border-transparent capitalize ring-1",
              SEVERITY[summary.severity],
            )}
          >
            {summary.severity} concern
          </Badge>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Refresh summary"
            onClick={run}
            disabled={pending}
          >
            {pending ? (
              <Loader className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <p className="text-sm">{summary.overview}</p>

      {summary.themes.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {summary.themes.map((t) => (
            <li key={t.label}>
              <Badge variant="secondary" className="gap-1.5">
                {t.label}
                <span className="font-semibold tabular-nums">{t.count}</span>
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-muted-foreground">
        Based on the latest {summary.basedOn} of {summary.total} reports. AI can
        be wrong, so check the reports below before acting.
      </p>
    </div>
  );
}
