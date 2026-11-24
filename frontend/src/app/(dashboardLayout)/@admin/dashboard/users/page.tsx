import Link from "next/link";
import {
  AlertCircle,
  Droplet,
  Flag,
  Phone,
  ShieldOff,
  UserCheck,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ListPagination } from "@/components/common/pagination";
import { bloodLabel } from "@/lib/blood";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { adminUserServices } from "@/service/admin-user.service";
import { ReportsDialog } from "@/components/module/admin/users/reports-dialog";
import { UserSuspendActions } from "@/components/module/admin/users/user-suspend-action";

export const metadata = { title: "Users · RedAid" };

const PAGE_SIZE = 10;
const BASE = "/dashboard/users";

const TABS = [
  { value: "all", label: "All" },
  { value: "reported", label: "Reported" },
  { value: "suspended", label: "Suspended" },
] as const;

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "U";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const view = TABS.find((t) => t.value === params.view)?.value ?? "all";
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const backend = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (view === "reported") backend.set("reported", "true");
  if (view === "suspended") backend.set("status", "SUSPENDED");
  if (q) backend.set("q", q);

  const { data, error } = await adminUserServices.getUsers(backend.toString());

  if (error || !data) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-3xl">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load users</AlertTitle>
        <AlertDescription>
          {error?.message ?? "Something went wrong."}
        </AlertDescription>
      </Alert>
    );
  }

  const { users, counts, pagination } = data;
  const tabCount = {
    all: counts.active + counts.suspended,
    reported: counts.reported,
    suspended: counts.suspended,
  };

  const href = (v: string) => {
    const p = new URLSearchParams();
    if (v !== "all") p.set("view", v);
    if (q) p.set("q", q);
    const s = p.toString();
    return s ? `${BASE}?${s}` : BASE;
  };

  const listQuery = new URLSearchParams();
  if (view !== "all") listQuery.set("view", view);
  if (q) listQuery.set("q", q);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Review reports and suspend accounts that abuse the platform. Suspended
          users can still log in and view, but not act.
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
            <p className="text-sm text-muted-foreground">
              Users with pending reports
            </p>
            <p className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-6xl font-bold tracking-tight text-transparent tabular-nums motion-safe:animate-gradient">
              {counts.reported}
            </p>
            <p className="text-xs text-muted-foreground">
              {counts.reported === 0
                ? "Nothing to review."
                : "Open the Reported tab to review them."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <div className="flex items-center gap-3 rounded-xl border bg-background/60 p-3 backdrop-blur">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-400">
                <UserCheck className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active users</p>
                <p className="font-semibold tabular-nums">{counts.active}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-background/60 p-3 backdrop-blur">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/30">
                <ShieldOff className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Suspended</p>
                <p className="font-semibold tabular-nums">{counts.suspended}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="View"
          className="flex gap-1 rounded-lg border bg-muted/50 p-1"
        >
          {TABS.map((tab) => (
            <Link
              key={tab.value}
              href={href(tab.value)}
              aria-current={view === tab.value ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                view === tab.value
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  view === tab.value
                    ? "bg-primary/10 text-primary"
                    : "bg-muted",
                )}
              >
                {tabCount[tab.value]}
              </span>
            </Link>
          ))}
        </nav>

        <form className="flex gap-2">
          {view !== "all" && <input type="hidden" name="view" value={view} />}
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search name or email"
            className="w-full sm:w-64"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <section className="space-y-3">
        {users.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>No users found</EmptyTitle>
              <EmptyDescription>Try another search or view.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <ul className="space-y-3">
              {users.map((user) => {
                const suspended = user.status === "SUSPENDED";
                return (
                  <li key={user.id}>
                    <Card
                      className={cn(
                        "group gap-0 overflow-hidden py-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
                        suspended
                          ? "border-destructive/30 hover:shadow-destructive/10"
                          : "hover:shadow-primary/10",
                      )}
                    >
                      <div className="space-y-3 p-5">
                        <div className="flex items-start gap-4">
                          <Avatar className="size-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-card transition-transform duration-300 group-hover:scale-105">
                            <AvatarImage
                              src={user.image ?? undefined}
                              alt={user.name}
                            />
                            <AvatarFallback>
                              {initials(user.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-lg font-semibold">
                                {user.name}
                              </h2>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "border-transparent ring-1",
                                  suspended
                                    ? "bg-destructive/10 text-destructive ring-destructive/30"
                                    : "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400",
                                )}
                              >
                                {suspended ? "Suspended" : "Active"}
                              </Badge>
                              {user.reports.pending > 0 && (
                                <Badge
                                  variant="outline"
                                  className="gap-1 border-transparent bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-400"
                                >
                                  <Flag className="size-3" />
                                  {user.reports.pending} pending
                                </Badge>
                              )}
                            </div>
                            <p className="truncate text-sm text-muted-foreground">
                              {user.email}
                            </p>
                            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="size-3" />
                                {user.phone}
                              </span>
                              {user.bloodType && (
                                <span className="flex items-center gap-1">
                                  <Droplet className="size-3" />
                                  {bloodLabel(user.bloodType)}
                                </span>
                              )}
                              <span>
                                {user.donationCount} donation
                                {user.donationCount === 1 ? "" : "s"}
                              </span>
                              <span>Joined {timeAgo(user.createdAt)}</span>
                            </p>
                          </div>
                        </div>

                        {suspended && user.suspensionReason && (
                          <p className="rounded-lg border bg-muted/40 p-3 text-sm">
                            <span className="text-muted-foreground">
                              Suspended
                              {user.suspendedAt
                                ? ` ${timeAgo(user.suspendedAt)}`
                                : ""}
                              :{" "}
                            </span>
                            {user.suspensionReason}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-5 py-3">
                        <ReportsDialog
                          target={{ userId: user.id }}
                          name={user.name}
                          pending={user.reports.pending}
                          total={user.reports.total}
                        />
                        <UserSuspendActions
                          userId={user.id}
                          userName={user.name}
                          suspended={suspended}
                        />
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
              query={listQuery}
              basePath={BASE}
            />
          </>
        )}
      </section>
    </div>
  );
}
