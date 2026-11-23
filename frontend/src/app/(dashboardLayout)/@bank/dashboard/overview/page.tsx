import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { overviewServices } from "@/service/overview.service";
import { VerificationBanner } from "@/components/module/bank/overview/verification-banner";
import { ActionCard } from "@/components/module/bank/overview/action-card";
import { TrendChart } from "@/components/module/bank/overview/trend-chart";
import { StockChart } from "@/components/module/bank/overview/stock-chart";
import { SummaryCards } from "@/components/module/bank/overview/summery-card";
import { RecentRequests } from "@/components/module/bank/overview/recent-requests";

export const metadata = { title: "Overview · RedAid" };

const VERIFICATION = {
  VERIFIED: {
    label: "Verified",
    chip: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400",
  },
  PENDING: {
    label: "Under review",
    chip: "bg-amber-500/10 text-amber-600 ring-amber-500/30 dark:text-amber-400",
  },
  REJECTED: {
    label: "Not approved",
    chip: "bg-destructive/10 text-destructive ring-destructive/30",
  },
  SUSPENDED: {
    label: "Suspended",
    chip: "bg-destructive/10 text-destructive ring-destructive/30",
  },
} as const;

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

export default async function BankOverviewPage() {
  const { data, error } = await overviewServices.getBankOverview();

  if (error || !data) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-3xl">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load your overview</AlertTitle>
        <AlertDescription>
          {error?.message ?? "Something went wrong."}
        </AlertDescription>
      </Alert>
    );
  }

  const { bank, counts, stock, weekly, recent } = data;
  const verification = VERIFICATION[bank.verificationStatus];
  const weeklyTotal = weekly.reduce((s, w) => s + w.fulfilled + w.rejected, 0);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 motion-safe:animate-fade-up">
        <div className="space-y-1.5">
          <Badge
            variant="outline"
            className={cn("border-transparent ring-1", verification.chip)}
          >
            {verification.label}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            Overview{" "}
            <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
              {bank.name}
            </span>
          </h1>
        </div>
        <Button
          variant="outline"
          render={<Link href="/dashboard/inventory" />}
          nativeButton={false}
        >
          Update inventory
        </Button>
      </header>

      <VerificationBanner bank={bank} />

      <div className="grid gap-6 lg:grid-cols-3">
        <ActionCard pending={counts.pending} approved={counts.approved} />

        <section
          style={delay(200)}
          className="rounded-2xl border bg-card p-6 lg:col-span-2 motion-safe:animate-fade-up"
        >
          <h2 className="font-semibold">Requests handled</h2>
          <p className="mb-4 text-sm text-muted-foreground">Last 8 weeks</p>
          {weeklyTotal === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              Completed and rejected requests will show up here.
            </div>
          ) : (
            <TrendChart data={weekly} />
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section
          style={delay(300)}
          className="rounded-2xl border bg-card p-6 lg:col-span-2 motion-safe:animate-fade-up"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Stock by blood type</h2>
              <p className="text-sm text-muted-foreground">
                {stock.out > 0 || stock.low > 0
                  ? `${stock.out} out of stock · ${stock.low} running low`
                  : "Every type is well stocked"}
              </p>
            </div>
            <Link
              href="/dashboard/inventory"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Edit <ArrowRight className="size-3" />
            </Link>
          </div>
          <StockChart items={stock.items} />
        </section>

        <SummaryCards counts={counts} total={stock.total} />
      </div>

      <RecentRequests recent={recent} />
    </div>
  );
}
