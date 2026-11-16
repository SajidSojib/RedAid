import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Inbox,
  MessageSquareQuote,
  Phone,
  ShieldX,
  User,
  type LucideIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ListPagination } from "@/components/common/pagination";
import { bloodLabel } from "@/lib/blood";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  bankRequestServices,
  type BankRequestStatus,
} from "@/service/bank-request.service";
import { IncomingRequestActions } from "@/components/module/bank/bank-requests/incoming-request-actions";

export const metadata = { title: "Incoming requests · RedAid" };

const PAGE_SIZE = 10;

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "history", label: "History" },
] as const;

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
    label: "Closed by system",
    chip: "bg-muted text-muted-foreground ring-border",
    icon: ShieldX,
  },
  WITHDRAWN: {
    label: "Withdrawn",
    chip: "bg-muted text-muted-foreground ring-border",
    icon: ShieldX,
  },
};

export default async function IncomingRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; page?: string }>;
}) {
  const params = await searchParams;
  const scope = TABS.some((t) => t.value === params.scope)
    ? (params.scope as (typeof TABS)[number]["value"])
    : "pending";
  const page = Math.max(1, Number(params.page) || 1);

  const { data, error } = await bankRequestServices.getIncomingBankRequests(
    `scope=${scope}&page=${page}&limit=${PAGE_SIZE}`,
  );

  if (error || !data) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-3xl">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load requests</AlertTitle>
        <AlertDescription>
          {error?.message ?? "Something went wrong."}
        </AlertDescription>
      </Alert>
    );
  }

  const { requests, counts, pagination } = data;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Incoming requests
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Approve or reject new requests, and close approved ones once the
          requester collects the blood.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[2.5rem_2.5rem] opacity-60 mask-[radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-16 size-72 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative grid gap-8 md:grid-cols-[1fr_16rem] md:items-center">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Waiting for your answer
            </p>
            <p className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-6xl font-bold tracking-tight text-transparent tabular-nums motion-safe:animate-gradient">
              {counts.pending}
            </p>
            <p className="text-xs text-muted-foreground">
              {counts.pending === 0
                ? "No one is waiting."
                : "Oldest requests are shown first."}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-background/60 p-3 backdrop-blur">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">To be collected</p>
              <p className="font-semibold tabular-nums">{counts.approved}</p>
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label="Status"
        className="flex gap-1 rounded-lg border bg-muted/50 p-1"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/bank-requests?scope=${tab.value}`}
            aria-current={scope === tab.value ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              scope === tab.value
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.value !== "history" && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  scope === tab.value
                    ? "bg-primary/10 text-primary"
                    : "bg-muted",
                )}
              >
                {counts[tab.value]}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {requests.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>Nothing here</EmptyTitle>
            <EmptyDescription>
              {scope === "pending"
                ? "New requests from donors and patients will show up here."
                : "Nothing to show in this list."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section className="space-y-3">
          <ul className="space-y-3">
            {requests.map((r) => {
              const ui = STATUS_UI[r.status];
              const Icon = ui.icon;
              const active = r.status === "PENDING" || r.status === "APPROVED";
              const enough = r.stock >= r.unitsRequested;

              return (
                <li key={r.id}>
                  <Card className="group gap-0 overflow-hidden py-0 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
                    <div className="space-y-4 p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/80 text-xl font-bold text-primary-foreground shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                          {bloodLabel(r.bloodType)}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-semibold">
                              {r.unitsRequested} bag
                              {r.unitsRequested === 1 ? "" : "s"}
                            </h2>
                            <Badge
                              variant="outline"
                              className={cn(
                                "gap-1 border-transparent ring-1",
                                ui.chip,
                              )}
                            >
                              <Icon className="size-3" />
                              {ui.label}
                            </Badge>
                          </div>
                          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <User className="size-3.5" />
                              {r.requester.name}
                            </span>
                            <a
                              href={`tel:${r.requester.phone}`}
                              className="flex items-center gap-1.5 transition-colors hover:text-primary"
                            >
                              <Phone className="size-3.5" />
                              {r.requester.phone}
                            </a>
                          </p>
                        </div>

                        <span className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(r.createdAt)}
                        </span>
                      </div>

                      {active && !enough && (
                        <p className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="size-4 shrink-0" />
                          You have {r.stock} bag{r.stock === 1 ? "" : "s"} of{" "}
                          {bloodLabel(r.bloodType)} in stock. Update your
                          inventory to{" "}
                          {r.status === "PENDING" ? "approve" : "complete"}{" "}
                          this.
                        </p>
                      )}

                      {r.donationRequest?.hospitalName && (
                        <p className="text-xs text-muted-foreground">
                          For a request at{" "}
                          <span className="font-medium text-foreground">
                            {r.donationRequest.hospitalName}
                          </span>
                        </p>
                      )}

                      {r.note && (
                        <p className="flex gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
                          <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-primary" />
                          {r.note}
                        </p>
                      )}
                    </div>

                    {active && (
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-5 py-3">
                        <span className="text-sm text-muted-foreground tabular-nums">
                          In stock: {r.stock}
                        </span>
                        <IncomingRequestActions
                          id={r.id}
                          status={r.status}
                          enoughStock={enough}
                        />
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>

          <ListPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            query={new URLSearchParams({ scope })}
            basePath="/dashboard/bank-requests"
          />
        </section>
      )}
    </div>
  );
}
