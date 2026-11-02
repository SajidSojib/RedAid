import Link from "next/link";
import {
  AlertCircle,
  CalendarCheck,
  CalendarClock,
  Droplet,
  Lock,
  Medal,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RequestPagination } from "@/components/module/request/request-pagination";
import { bloodLabel } from "@/lib/blood";
import { cn } from "@/lib/utils";
import { donationServices } from "@/service/donation.service";
import { achievementServices } from "@/service/achivement.service";
import { MILESTONES } from "@/constants/milestones";
import { userServices } from "@/service/user.service";
import CertificateDialog from "@/components/module/user/my-donations/certificate-dialog";
import { env } from "@/env";

export const metadata = { title: "My donations · RedAid" };

// One color per badge, with dark mode handled
const BADGE_UI: Record<string, { chip: string; glow: string }> = {
  BRONZE: {
    chip: "bg-orange-500/10 text-orange-600 ring-orange-500/30 dark:text-orange-400",
    glow: "hover:shadow-orange-500/20",
  },
  SILVER: {
    chip: "bg-slate-500/10 text-slate-600 ring-slate-500/30 dark:text-slate-300",
    glow: "hover:shadow-slate-500/25",
  },
  GOLD: {
    chip: "bg-amber-500/10 text-amber-600 ring-amber-500/30 dark:text-amber-400",
    glow: "hover:shadow-amber-500/25",
  },
  DIAMOND: {
    chip: "bg-sky-500/10 text-sky-600 ring-sky-500/30 dark:text-sky-400",
    glow: "hover:shadow-sky-500/25",
  },
  PLATINUM: {
    chip: "bg-violet-500/10 text-violet-600 ring-violet-500/30 dark:text-violet-400",
    glow: "hover:shadow-violet-500/25",
  },
};

const title = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function MyDonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const pageNumber = Math.max(1, Number(page) || 1);

  const [history, achievements, { data: session }] = await Promise.all([
    donationServices.getMyDonations(`page=${pageNumber}&limit=8`),
    achievementServices.getMyAchievements(),
    userServices.getSessionServer(),
  ]);
  const donorName = session?.user?.name ?? "Donor";

  if (
    history.error ||
    !history.data ||
    achievements.error ||
    !achievements.data
  ) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-3xl">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load your donations</AlertTitle>
        <AlertDescription>
          {history.error?.message ??
            achievements.error?.message ??
            "Something went wrong."}
        </AlertDescription>
      </Alert>
    );
  }

  const { donations, summary, pagination } = history.data;
  const { points, currentBadge, nextMilestone, badges, certificates } =
    achievements.data;

  const milestones = MILESTONES.map((m) => ({
    ...m,
    earnedAt: badges.find((b) => b.code === m.badge)?.awardedAt ?? null,
    certificateId: certificates.find((c) => c.code === m.badge)?.id ?? null,
  }));

  const { eligibility } = summary;

  const nextTarget = nextMilestone
    ? points + nextMilestone.donationsNeeded
    : null;
  const percent = nextTarget ? Math.round((points / nextTarget) * 100) : 100;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">My donations</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Every confirmed donation earns a point. Collect badges and
          certificates as you reach each milestone.
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
          <div className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground">Your points</p>
              <p className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-6xl font-bold tracking-tight text-transparent tabular-nums motion-safe:animate-gradient">
                {points}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {nextMilestone
                    ? `Next: ${title(nextMilestone.badge)} badge`
                    : "You've earned every badge"}
                </span>
                {nextTarget && (
                  <span className="text-muted-foreground tabular-nums">
                    {points} / {nextTarget}
                  </span>
                )}
              </div>
              <Progress value={percent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {nextMilestone
                  ? `${plural(nextMilestone.donationsNeeded, "more donation")} to unlock it${
                      nextMilestone.certificate ? " and a certificate" : ""
                    }`
                  : "Thank you for everything you have given."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <div className="flex items-center gap-3 rounded-xl border bg-background/60 p-3 backdrop-blur">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full ring-1",
                  currentBadge
                    ? BADGE_UI[currentBadge]?.chip
                    : "bg-muted text-muted-foreground ring-border",
                )}
              >
                <Medal className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current badge</p>
                <p className="font-semibold">
                  {currentBadge ? title(currentBadge) : "None yet"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border bg-background/60 p-3 backdrop-blur">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  eligibility.eligible
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {eligibility.eligible ? (
                  <CalendarCheck className="size-5" />
                ) : (
                  <CalendarClock className="size-5" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next donation</p>
                <p className="font-semibold">
                  {eligibility.eligible
                    ? "Ready to donate"
                    : eligibility.nextEligibleDate &&
                      formatDate(eligibility.nextEligibleDate)}
                </p>
                {!eligibility.eligible && (
                  <p className="text-xs text-muted-foreground">
                    {plural(eligibility.daysLeft, "day")} to go
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Badges and certificates */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Badges and certificates
        </h2>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {milestones.map((m) => {
            const earned = m.earnedAt !== null;
            const ui = BADGE_UI[m.badge];

            return (
              <li key={m.badge}>
                <Card
                  className={cn(
                    "group h-full py-4 transition-all duration-300",
                    earned
                      ? cn("hover:-translate-y-0.5 hover:shadow-lg", ui?.glow)
                      : "border-dashed bg-muted/30",
                  )}
                >
                  <CardContent className="flex items-center gap-3 px-4">
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-full transition-transform duration-300",
                        earned
                          ? cn(
                              "ring-1 group-hover:scale-110 group-hover:rotate-6",
                              ui?.chip,
                            )
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {earned ? (
                        <Medal className="size-5" />
                      ) : (
                        <Lock className="size-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "font-medium",
                          !earned && "text-muted-foreground",
                        )}
                      >
                        {title(m.badge)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {earned
                          ? `Earned ${formatDate(m.earnedAt!)}`
                          : `At ${plural(m.count, "donation")}${m.certificate ? " + certificate" : ""}`}
                      </p>
                    </div>

                    {m.certificateId && m.earnedAt && (
                      <CertificateDialog
                        donorName={donorName}
                        badge={m.badge}
                        donations={m.count}
                        awardedAt={m.earnedAt}
                        certificateId={m.certificateId}
                        verifyUrl={`${env.NEXT_PUBLIC_FRONTEND_URL}/verify/${m.certificateId}`}
                      />
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      {/* History */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Donation history
        </h2>

        {donations.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Droplet />
              </EmptyMedia>
              <EmptyTitle>No donations yet</EmptyTitle>
              <EmptyDescription>
                Your first confirmed donation appears here, and it earns you the
                Bronze badge.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                render={<Link href="/all-requests" />}
                nativeButton={false}
              >
                Browse blood requests
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <Card className="py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Location
                    </TableHead>
                    <TableHead>Blood</TableHead>
                    <TableHead className="text-right">Donated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(d.donatedAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {d.request?.hospitalName ?? "Blood donation"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {d.request
                          ? d.request.union
                            ? `${d.request.union.name}, ${d.request.upazila.name}`
                            : d.request.upazila.name
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {d.request ? (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                            {bloodLabel(d.request.bloodType)}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {plural(d.units, "bag")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <RequestPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              query={new URLSearchParams()}
              basePath="/dashboard/my-donations"
            />
          </>
        )}
      </section>
    </div>
  );
}
