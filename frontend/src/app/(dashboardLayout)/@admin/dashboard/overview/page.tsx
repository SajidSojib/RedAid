import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { overviewServices } from "@/service/overview.service";
import { ActionCard } from "@/components/module/admin/overview/action-card";
import { GrowthChart } from "@/components/module/admin/overview/growth-chart";
import { StatCards } from "@/components/module/admin/overview/stat-cards";
import { OutcomesChart } from "@/components/module/admin/overview/outcomes-chart";
import { BanksQueue } from "@/components/module/admin/overview/banks-queue";
import { ReportsQueue } from "@/components/module/admin/overview/reports-queue";
import { BloodChart } from "@/components/module/admin/overview/blood-chart";

export const metadata = { title: "Overview · RedAid" };

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

export default async function AdminOverviewPage() {
  const { data, error } = await overviewServices.getAdminOverview();

  if (error || !data) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-3xl">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load the overview</AlertTitle>
        <AlertDescription>
          {error?.message ?? "Something went wrong."}
        </AlertDescription>
      </Alert>
    );
  }

  const { counts, weekly, blood, pendingBanks, latestReports } = data;
  const weeklyTotal = weekly.reduce(
    (s, w) => s + w.donations + w.signups + w.requests,
    0,
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="space-y-1.5 motion-safe:animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight">
          Platform{" "}
          <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
            overview
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          What needs a decision, and how RedAid is doing.
        </p>
      </header>

      <div className="grid gap-6 min-w-0 lg:grid-cols-3">
        <ActionCard
          banks={counts.banks.PENDING}
          reports={counts.pendingReports}
        />

        <section
          style={delay(200)}
          className="rounded-2xl min-w-0 border bg-card p-6 lg:col-span-2 motion-safe:animate-fade-up"
        >
          <h2 className="font-semibold">Platform activity</h2>
          <p className="mb-4 text-sm text-muted-foreground">Last 8 weeks</p>
          {weeklyTotal === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              Activity will show up here as people join and donate.
            </div>
          ) : (
            <GrowthChart data={weekly} />
          )}
        </section>
      </div>

      <StatCards counts={counts} />

      <div className="grid gap-6 lg:grid-cols-3">
        <section
          style={delay(400)}
          className="rounded-2xl min-w-0 border bg-card p-6 lg:col-span-2 motion-safe:animate-fade-up"
        >
          <h2 className="font-semibold">Blood type demand and supply</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Left axis: requests in the last 8 weeks. Right axis: active donors.
          </p>
          <BloodChart data={blood} />
        </section>

        <section
          style={delay(500)}
          className="rounded-2xl border bg-card p-6 motion-safe:animate-fade-up"
        >
          <h2 className="font-semibold">Request outcomes</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            All donor requests so far
          </p>
          <OutcomesChart requests={counts.requests} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BanksQueue banks={pendingBanks} />
        <ReportsQueue reports={latestReports} />
      </div>
    </div>
  );
}
