import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Droplet,
  Info,
  PackageCheck,
  ShieldX,
  type LucideIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bloodLabel } from "@/lib/blood";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { BankRequestStatus } from "@/service/bank-request.service";
import { overviewServices } from "@/service/overview.service";

export const metadata = { title: "Overview · RedAid" };

const LOW = 5;

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
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30",
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
} as const;

const fill = (units: number) =>
  units === 0
    ? { bar: "from-muted to-muted", text: "text-muted-foreground/50" }
    : units < LOW
      ? {
          bar: "from-amber-500 to-amber-400",
          text: "text-amber-600 dark:text-amber-400",
        }
      : { bar: "from-primary to-destructive", text: "text-foreground" };

const weekLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

// ---------- trend chart (plain SVG, draws itself) ----------

type Week = { weekStart: string; fulfilled: number; rejected: number };

function TrendChart({ weekly }: { weekly: Week[] }) {
  const W = 600,
    H = 220,
    left = 28,
    right = 10,
    top = 12,
    bottom = 26;
  const plotH = H - top - bottom;
  const plotW = W - left - right;

  const rawMax = Math.max(
    ...weekly.map((w) => Math.max(w.fulfilled, w.rejected)),
  );
  const max = Math.max(4, Math.ceil(rawMax / 2) * 2);
  const ticks = [0, max / 2, max];

  const x = (i: number) => left + (plotW / (weekly.length - 1)) * i;
  const y = (v: number) => top + plotH - (v / max) * plotH;

  const line = (key: "fulfilled" | "rejected") =>
    weekly
      .map((w, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(w[key])}`)
      .join(" ");
  const area = `${line("fulfilled")} L${x(weekly.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Requests completed and rejected per week"
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="ov-fill" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            style={{ stopColor: "var(--primary)", stopOpacity: 0.3 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: "var(--primary)", stopOpacity: 0 }}
          />
        </linearGradient>
      </defs>

      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={left}
            x2={W - right}
            y1={y(t)}
            y2={y(t)}
            className="stroke-border"
            strokeDasharray={t === 0 ? undefined : "3 4"}
          />
          <text
            x={left - 8}
            y={y(t) + 3}
            textAnchor="end"
            className="fill-muted-foreground text-[10px] tabular-nums"
          >
            {t}
          </text>
        </g>
      ))}

      <path
        d={area}
        fill="url(#ov-fill)"
        className="motion-safe:animate-fade-in"
      />
      <path
        d={line("rejected")}
        pathLength={1}
        strokeDasharray={1}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-destructive/60 motion-safe:animate-draw"
      />
      <path
        d={line("fulfilled")}
        pathLength={1}
        strokeDasharray={1}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary motion-safe:animate-draw"
      />

      {weekly.map((w, i) => (
        <g key={w.weekStart} className="group">
          <title>{`Week of ${weekLabel(w.weekStart)}: ${w.fulfilled} completed, ${w.rejected} rejected`}</title>
          <circle
            cx={x(i)}
            cy={y(w.fulfilled)}
            r={4}
            strokeWidth={2}
            className="fill-card stroke-primary motion-safe:animate-fade-in transition-[r] group-hover:[r:6]"
          />
          <text
            x={x(i)}
            y={H - 7}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {weekLabel(w.weekStart)}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ---------- page ----------

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
  const scale = Math.max(10, ...stock.items.map((i) => i.unitsAvailable));

  const summary = [
    { label: "Bags given", value: counts.bagsGiven, icon: Droplet },
    {
      label: "Requests completed",
      value: counts.fulfilled,
      icon: PackageCheck,
    },
    { label: "Bags in stock", value: stock.total, icon: Clock },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header */}
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

      {bank.verificationStatus !== "VERIFIED" && (
        <Link
          href="/dashboard/bank-profile"
          className={cn(
            "flex items-start gap-3 rounded-2xl border p-4 text-sm transition-colors hover:bg-muted/40 motion-safe:animate-fade-up",
            bank.verificationStatus === "REJECTED"
              ? "border-destructive/30 bg-destructive/5"
              : "border-amber-500/30 bg-amber-500/5",
          )}
        >
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-semibold">
              {bank.verificationStatus === "REJECTED"
                ? "Your bank was not approved"
                : "Your bank is waiting for review"}
            </p>
            <p className="text-muted-foreground">
              {bank.verificationStatus === "REJECTED"
                ? `${bank.verificationNote ?? "No reason was given."} Update your details to submit again.`
                : "Requesters can't see it until an admin verifies it."}
            </p>
          </div>
          <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        </Link>
      )}

      {/* Action card + trend */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section
          style={delay(100)}
          className="relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/20 motion-safe:animate-fade-up"
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--primary-foreground)_10%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--primary-foreground)_10%,transparent)_1px,transparent_1px)] bg-size-[2.5rem_2.5rem] mask-[radial-gradient(ellipse_at_top_right,black,transparent_75%)]"
          />
          <div
            aria-hidden
            className="absolute -right-16 -bottom-20 -z-10 size-64 rounded-full bg-primary-foreground/10 blur-3xl"
          />

          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm text-primary-foreground/80">
              {counts.pending > 0 && (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full rounded-full bg-primary-foreground opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary-foreground" />
                </span>
              )}
              Waiting for your answer
            </p>
            <p className="text-7xl leading-none font-bold tracking-tight tabular-nums">
              {counts.pending}
            </p>
            <p className="text-sm text-primary-foreground/70">
              {counts.pending === 0
                ? "You're all caught up."
                : `request${counts.pending === 1 ? "" : "s"} to review, oldest first`}
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/dashboard/bank-requests?scope=approved"
              className="flex items-center justify-between rounded-xl bg-primary-foreground/10 px-4 py-3 text-sm backdrop-blur transition-colors hover:bg-primary-foreground/15"
            >
              <span className="text-primary-foreground/80">
                To be collected
              </span>
              <span className="font-semibold tabular-nums">
                {counts.approved}
              </span>
            </Link>
            <Button
              variant="secondary"
              className="w-full"
              render={<Link href="/dashboard/bank-requests" />}
              nativeButton={false}
            >
              Review requests
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>

        <section
          style={delay(200)}
          className="rounded-2xl border bg-card p-6 lg:col-span-2 motion-safe:animate-fade-up"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Requests handled</h2>
              <p className="text-sm text-muted-foreground">Last 8 weeks</p>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-destructive/60" />
                Rejected
              </span>
            </div>
          </div>

          {weeklyTotal === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              Completed and rejected requests will show up here.
            </div>
          ) : (
            <TrendChart weekly={weekly} />
          )}
        </section>
      </div>

      {/* Blood-bag gauges + summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section
          style={delay(300)}
          className="relative overflow-hidden rounded-2xl border bg-card p-6 lg:col-span-2 motion-safe:animate-fade-up"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[2.5rem_2.5rem] opacity-50 mask-[radial-gradient(ellipse_at_top_left,black,transparent_70%)]"
          />
          <div className="relative">
            <div className="mb-5 flex items-start justify-between gap-3">
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

            <ul className="grid grid-cols-4 gap-3 sm:grid-cols-8">
              {stock.items.map((item, i) => {
                const f = fill(item.unitsAvailable);
                const pct =
                  item.unitsAvailable === 0
                    ? 0
                    : Math.max(8, (item.unitsAvailable / scale) * 100);
                return (
                  <li
                    key={item.bloodType}
                    className="group flex flex-col items-center gap-2"
                  >
                    <span
                      className={cn(
                        "text-xl leading-none font-bold tabular-nums",
                        f.text,
                      )}
                    >
                      {item.unitsAvailable}
                    </span>
                    <div className="relative h-36 w-full max-w-12 overflow-hidden rounded-2xl border bg-muted/60 transition-transform duration-300 group-hover:-translate-y-1">
                      <div
                        style={{
                          height: `${pct}%`,
                          animationDelay: `${400 + i * 80}ms`,
                        }}
                        className={cn(
                          "absolute inset-x-0 bottom-0 origin-bottom bg-linear-to-t motion-safe:animate-fill-up",
                          f.bar,
                        )}
                      >
                        <span
                          aria-hidden
                          className="absolute inset-y-1 left-1.5 w-1 rounded-full bg-white/30"
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {bloodLabel(item.bloodType)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section
          style={delay(400)}
          className="space-y-3 motion-safe:animate-fade-up"
        >
          {summary.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="group flex items-center gap-4 rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-3xl leading-none font-bold tabular-nums">
                  {value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Recent */}
      <section
        style={delay(500)}
        className="overflow-hidden rounded-2xl border bg-card motion-safe:animate-fade-up"
      >
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
            No requests yet. They appear here once people ask your bank for
            blood.
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
                      {r.unitsRequested} bag{r.unitsRequested === 1 ? "" : "s"}{" "}
                      · {timeAgo(r.createdAt)}
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
    </div>
  );
}
