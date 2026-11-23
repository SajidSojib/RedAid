import Link from "next/link";
import { Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/time";
import type { AdminOverview } from "@/service/overview.service";

const CATEGORY: Record<string, string> = {
  FAKE_REQUEST: "Fake request",
  ABUSIVE: "Abusive",
  NO_SHOW: "No-show",
  WRONG_INFORMATION: "Wrong information",
  OTHER: "Other",
};

export function ReportsQueue({
  reports,
}: {
  reports: AdminOverview["latestReports"];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card motion-safe:animate-fade-up">
      <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
        <div>
          <h2 className="font-semibold">Latest reports</h2>
          <p className="text-sm text-muted-foreground">Pending only</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard/users?view=reported" />}
          nativeButton={false}
        >
          Reported users
        </Button>
      </div>

      {reports.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">
          No pending reports.
        </p>
      ) : (
        <ul className="divide-y">
          {reports.map((r) => {
            const target = r.reportedUser ?? r.reportedBank;
            const href = r.reportedUser
              ? "/dashboard/users?view=reported"
              : "/dashboard/bank-management?status=VERIFIED";
            return (
              <li key={r.id}>
                <Link
                  href={href}
                  className="flex items-start gap-4 px-6 py-3.5 transition-colors hover:bg-muted/30"
                >
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/30">
                    <Flag className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {target?.name ?? "Unknown"}
                      </p>
                      <Badge variant="secondary">
                        {CATEGORY[r.category] ?? r.category}
                      </Badge>
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {r.reason}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      By {r.reporter.name} · {timeAgo(r.createdAt)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
