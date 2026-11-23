import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/time";
import type { AdminOverview } from "@/service/overview.service";

export function BanksQueue({
  banks,
}: {
  banks: AdminOverview["pendingBanks"];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card motion-safe:animate-fade-up">
      <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
        <div>
          <h2 className="font-semibold">Banks waiting for review</h2>
          <p className="text-sm text-muted-foreground">Oldest first</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard/bank-management?status=PENDING" />}
          nativeButton={false}
        >
          Open queue
        </Button>
      </div>

      {banks.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">
          No banks are waiting.
        </p>
      ) : (
        <ul className="divide-y">
          {banks.map((b) => (
            <li key={b.id}>
              <Link
                href="/dashboard/bank-management?status=PENDING"
                className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/30"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-400">
                  <Building2 className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.upazila.name}, {b.upazila.district.name} ·{" "}
                    {timeAgo(b.createdAt)}
                  </p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
