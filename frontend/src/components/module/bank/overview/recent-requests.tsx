import Link from "next/link";
import { CheckCircle2, Clock, ShieldX, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bloodLabel } from "@/lib/blood";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { BankRequestStatus } from "@/service/bank-request.service";
import type { BankOverview } from "@/service/overview.service";

const STATUS_UI: Record<
  BankRequestStatus,
  { label: string; chip: string; icon: LucideIcon }
> = {
  PENDING: {
    label: "Pending",
    chip: "bg-amber-500/10 text-amber-600 ring-amber-500/30 dark:text-amber-400",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    chip: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  FULFILLED: {
    label: "Completed",
    chip: "bg-primary/10 text-primary ring-primary/30",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    chip: "bg-destructive/10 text-destructive ring-destructive/30",
    icon: ShieldX,
  },
  NO_SHOW: {
    label: "No-show",
    chip: "bg-destructive/10 text-destructive ring-destructive/30",
    icon: ShieldX,
  },
  CANCELLED: {
    label: "Closed",
    chip: "bg-muted text-muted-foreground ring-border",
    icon: ShieldX,
  },
  WITHDRAWN: {
    label: "Withdrawn",
    chip: "bg-muted text-muted-foreground ring-border",
    icon: ShieldX,
  },
};

export function RecentRequests({ recent }: { recent: BankOverview["recent"] }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card motion-safe:animate-fade-up">
      <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
        <div>
          <h2 className="font-semibold">Recent requests</h2>
          <p className="text-sm text-muted-foreground">
            The latest 5 sent to your bank
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard/bank-requests" />}
          nativeButton={false}
        >
          View all
        </Button>
      </div>

      {recent.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">
          No requests yet. They appear here once people ask your bank for blood.
        </p>
      ) : (
        <ul className="divide-y">
          {recent.map((r) => {
            const ui = STATUS_UI[r.status];
            const Icon = ui.icon;
            return (
              <li
                key={r.id}
                className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/30"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/80 font-bold text-primary-foreground shadow-sm transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                  {bloodLabel(r.bloodType)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.requester.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.unitsRequested} bag{r.unitsRequested === 1 ? "" : "s"} ·{" "}
                    {timeAgo(r.createdAt)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("gap-1 border-transparent ring-1", ui.chip)}
                >
                  <Icon className="size-3" />
                  {ui.label}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
