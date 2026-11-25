"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmAction } from "@/components/common/confirm-action";
import { dismissReport, getReports } from "@/action/report.action";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Report, ReportTarget } from "@/service/report.service";
import { ReportSummary } from "./report-summery";

const CATEGORY: Record<string, string> = {
  FAKE_REQUEST: "Fake request",
  ABUSIVE: "Abusive",
  NO_SHOW: "No-show",
  WRONG_INFORMATION: "Wrong information",
  OTHER: "Other",
};

const STATUS: Record<Report["status"], { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-600 ring-amber-500/30 dark:text-amber-400",
  },
  DISMISSED: {
    label: "Dismissed",
    className: "bg-muted text-muted-foreground ring-border",
  },
  ACTION_TAKEN: {
    label: "Action taken",
    className: "bg-destructive/10 text-destructive ring-destructive/30",
  },
};

export function ReportsDialog({
  target,
  name,
  pending,
  total,
}: {
  target: ReportTarget;
  name: string;
  pending: number;
  total: number;
}) {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data, error: failure } = await getReports(target);
    if (failure || !data) {
      setError(failure?.message ?? "Couldn't load the reports");
      return;
    }
    setError(null);
    setReports(data.reports);
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) {
          setReports(null);
          void load();
        }
      }}
    >
      <DialogTrigger
        render={<Button size="sm" variant="ghost" disabled={total === 0} />}
      >
        <Flag className="size-4" />
        Reports ({total})
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reports on {name}</DialogTitle>
          <DialogDescription>
            {pending} pending of {total}. Only people who worked with them on a
            request can report.
          </DialogDescription>
        </DialogHeader>
        
        {total >= 3 && <ReportSummary target={target} total={total} />}

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : reports === null ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => {
              const ui = STATUS[r.status];
              return (
                <li
                  key={r.id}
                  className="space-y-2 rounded-lg border p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {CATEGORY[r.category] ?? r.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("border-transparent ring-1", ui.className)}
                    >
                      {ui.label}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {timeAgo(r.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{r.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    Reported by {r.reporter.name}
                    {r.reporter.role === "BANK" ? " (blood bank)" : ""}
                  </p>
                  {r.adminNote && (
                    <p className="rounded-md bg-muted/50 p-2 text-xs">
                      <span className="text-muted-foreground">
                        Admin note:{" "}
                      </span>
                      {r.adminNote}
                    </p>
                  )}
                  {r.status === "PENDING" && (
                    <ConfirmAction
                      size="sm"
                      label="Dismiss"
                      title="Dismiss this report?"
                      description="The reporter is told no action was needed."
                      confirmLabel="Yes, dismiss"
                      onConfirm={async () => {
                        const { error: failure } = await dismissReport(r.id);
                        if (failure) {
                          toast.error(failure.message);
                          return;
                        }
                        toast.success("Report dismissed");
                        await load();
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
