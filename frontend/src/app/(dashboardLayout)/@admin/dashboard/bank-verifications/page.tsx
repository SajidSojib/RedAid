import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
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
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  bankServices,
  type AdminBanksPayload,
  type VerificationStatus,
} from "@/service/bank.service";
import { BankDetailsDialog } from "@/components/module/admin/bank-verification/bank-details-dialog";
import { BankReviewActions } from "@/components/module/admin/bank-verification/bank-review-actions";

export const metadata = { title: "Bank verifications · RedAid" };

const PAGE_SIZE = 10;

const TABS: { value: VerificationStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

// One color per status, with dark mode handled (same approach as the badge cards)
const STATUS_UI: Record<
  VerificationStatus,
  { chip: string; glow: string; icon: LucideIcon }
> = {
  PENDING: {
    chip: "bg-amber-500/10 text-amber-600 ring-amber-500/30 dark:text-amber-400",
    glow: "hover:shadow-amber-500/20",
    icon: Clock,
  },
  VERIFIED: {
    chip: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400",
    glow: "hover:shadow-emerald-500/20",
    icon: CheckCircle2,
  },
  REJECTED: {
    chip: "bg-destructive/10 text-destructive ring-destructive/30",
    glow: "hover:shadow-destructive/20",
    icon: ShieldX,
  },
};

export default async function BankVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status: VerificationStatus = TABS.some((t) => t.value === params.status)
    ? (params.status as VerificationStatus)
    : "PENDING";
  const page = Math.max(1, Number(params.page) || 1);

  const { data, error } = await bankServices.getBanks<AdminBanksPayload>(
    `status=${status}&page=${page}&limit=${PAGE_SIZE}`,
  );

  if (error || !data) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-3xl">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load blood banks</AlertTitle>
        <AlertDescription>
          {error?.message ?? "Something went wrong."}
        </AlertDescription>
      </Alert>
    );
  }

  const { banks, counts, pagination } = data;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bank verifications
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Review new registrations, and revoke a bank that should no longer be
          public.
        </p>
      </header>

      {/* Hero summary */}
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
            <p className="text-sm text-muted-foreground">Waiting for review</p>
            <p className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-6xl font-bold tracking-tight text-transparent tabular-nums motion-safe:animate-gradient">
              {counts.PENDING}
            </p>
            <p className="text-xs text-muted-foreground">
              {counts.PENDING === 0
                ? "The queue is clear."
                : "Oldest registrations are shown first."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            {(["VERIFIED", "REJECTED"] as const).map((s) => {
              const ui = STATUS_UI[s];
              const Icon = ui.icon;
              return (
                <div
                  key={s}
                  className="flex items-center gap-3 rounded-xl border bg-background/60 p-3 backdrop-blur"
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full ring-1",
                      ui.chip,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {s.toLowerCase()}
                    </p>
                    <p className="font-semibold tabular-nums">{counts[s]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Status tabs */}
      <nav
        aria-label="Status"
        className="flex gap-1 rounded-lg border bg-muted/50 p-1"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/bank-verifications?status=${tab.value}`}
            aria-current={status === tab.value ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              status === tab.value
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs tabular-nums",
                status === tab.value
                  ? "bg-primary/10 text-primary"
                  : "bg-muted",
              )}
            >
              {counts[tab.value]}
            </span>
          </Link>
        ))}
      </nav>

      {/* List */}
      <section className="space-y-3">
        {banks.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 />
              </EmptyMedia>
              <EmptyTitle>No {status.toLowerCase()} banks</EmptyTitle>
              <EmptyDescription>
                {status === "PENDING"
                  ? "New registrations will show up here."
                  : "Nothing to show in this list."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <ul className="space-y-3">
              {banks.map((bank) => {
                const ui = STATUS_UI[bank.verificationStatus];
                const Icon = ui.icon;

                return (
                  <li key={bank.id}>
                    <Card
                      className={cn(
                        "group gap-0 overflow-hidden py-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
                        ui.glow,
                      )}
                    >
                      <div className="space-y-4 p-5">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "flex size-11 shrink-0 items-center justify-center rounded-full ring-1 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6",
                              ui.chip,
                            )}
                          >
                            <Building2 className="size-5" />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-lg font-semibold">
                                {bank.name}
                              </h2>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "gap-1 border-transparent ring-1 capitalize",
                                  ui.chip,
                                )}
                              >
                                <Icon className="size-3" />
                                {bank.verificationStatus.toLowerCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              License{" "}
                              <span className="font-mono text-foreground">
                                {bank.licenseNumber}
                              </span>
                            </p>
                          </div>

                          <span className="shrink-0 text-xs text-muted-foreground">
                            {timeAgo(bank.createdAt)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-3.5" />
                            {bank.upazila.name}, {bank.upazila.district.name}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Phone className="size-3.5" />
                            {bank.phone}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="size-3.5" />
                            {bank.owner.name}
                          </span>
                        </div>

                        {bank.verificationNote && (
                          <p className="rounded-lg border bg-muted/40 p-3 text-sm">
                            <span className="text-muted-foreground">
                              Note:{" "}
                            </span>
                            {bank.verificationNote}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-5 py-3">
                        <BankDetailsDialog bank={bank} />
                        <div className="flex gap-2">
                          <BankReviewActions
                            bankId={bank.id}
                            bankName={bank.name}
                            status={bank.verificationStatus}
                          />
                        </div>
                      </div>
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
              query={new URLSearchParams({ status })}
              basePath="/dashboard/bank-verifications"
            />
          </>
        )}
      </section>
    </div>
  );
}
