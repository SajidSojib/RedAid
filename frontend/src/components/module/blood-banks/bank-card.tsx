import type { ReactNode } from "react";
import Link from "next/link";
import { BadgeCheck, Building2, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OpenRequest, RequestBloodDialog } from "./request-blood-dialog";
import { bloodLabel } from "@/lib/blood";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { PublicBank } from "@/service/bank.service";
import { ReportDialog } from "@/components/common/report-dialog";

const LOW = 5;

export type MyRequests = {
  count: number;
  limit: number;
  byBank: Record<string, string>;
  openRequests: OpenRequest[];
};

const tone = (units: number) =>
  units === 0
    ? "border-dashed text-muted-foreground/40"
    : units < LOW
      ? "border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400"
      : "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400";

// Returns null when there's nothing to show, so the card skips its footer
function renderAction(
  bank: PublicBank,
  loggedIn: boolean,
  role: string | null,
  bloodType: string | undefined,
  returnTo: string,
  myRequests?: MyRequests,
): ReactNode {
  if (!loggedIn) {
    return (
      <>
        <span className="text-sm text-muted-foreground">
          Log in to request blood
        </span>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/login?next=${encodeURIComponent(returnTo)}`} />}
          nativeButton={false}
        >
          Log in
        </Button>
      </>
    );
  }

  // Banks and admins can browse but don't request
  if (role !== "USER") return null;

  const here = myRequests?.byBank[bank.id];
  const hasApproved = Object.values(myRequests?.byBank ?? {}).includes(
    "APPROVED",
  );
  const full = (myRequests?.count ?? 0) >= (myRequests?.limit ?? 3);

  if (here) {
    return (
      <>
        <span
          className={cn(
            "text-sm font-medium",
            here === "APPROVED"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground",
          )}
        >
          {here === "APPROVED" ? "Approved. Go collect it" : "Request pending"}
        </span>
        <div className="flex items-center gap-2">
          <ReportDialog target={{ bankId: bank.id }} name={bank.name} />
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/dashboard/my-requests?type=bank" />}
            nativeButton={false}
          >
            View
          </Button>
        </div>
      </>
    );
  }

  if (hasApproved || full) {
    return (
      <>
        <span className="text-sm text-muted-foreground">
          {hasApproved
            ? "Collect your approved request first"
            : `You have ${myRequests?.limit} active requests`}
        </span>
        <div className="flex items-center gap-2">
          <ReportDialog target={{ bankId: bank.id }} name={bank.name} />

          <Button size="sm" variant="outline" disabled>
            Request blood
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <span className="text-sm text-muted-foreground">Need blood?</span>
        <RequestBloodDialog
          bankId={bank.id}
          bankName={bank.name}
          inventory={bank.inventory}
          defaultBloodType={bloodType}
          openRequests={myRequests?.openRequests}
        />
    </>
  );
}

export function BankCard({
  bank,
  role,
  loggedIn,
  bloodType,
  returnTo,
  myRequests,
}: {
  bank: PublicBank;
  role: string | null;
  loggedIn: boolean;
  bloodType?: string; // the blood type filter, to highlight it
  returnTo: string;
  myRequests?: MyRequests;
}) {
  const total = bank.inventory.reduce((sum, i) => sum + i.unitsAvailable, 0);
  const updated = bank.inventory
    .map((i) => new Date(i.updatedAt).getTime())
    .filter(Boolean);
  const lastUpdate = updated.length
    ? new Date(Math.max(...updated)).toISOString()
    : null;

  const action = renderAction(
    bank,
    loggedIn,
    role,
    bloodType,
    returnTo,
    myRequests,
  );

  return (
    <Card className="group h-full gap-0 overflow-hidden py-0 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
      <div className="space-y-5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
            <Building2 className="size-6" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="flex items-center gap-1.5 text-lg leading-tight font-semibold">
              <span className="truncate">{bank.name}</span>
              <BadgeCheck
                aria-label="Verified"
                className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              />
            </h2>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              <span
                className="flex min-w-0 items-center gap-1"
                title={bank.address}
              >
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">
                  {bank.upazila.name}, {bank.upazila.district.name}
                </span>
              </span>
              <a
                href={`tel:${bank.phone}`}
                className="flex items-center gap-1 transition-colors hover:text-primary"
              >
                <Phone className="size-3.5 shrink-0" />
                {bank.phone}
              </a>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium">Blood in stock</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              <span className="font-semibold text-foreground">{total}</span> bag
              {total === 1 ? "" : "s"} total
            </p>
          </div>

          <ul className="grid grid-cols-4 gap-2">
            {bank.inventory.map((item) => (
              <li
                key={item.bloodType}
                className={cn(
                  "rounded-lg border px-2 py-2 text-center transition-colors",
                  tone(item.unitsAvailable),
                  item.bloodType === bloodType &&
                    "ring-2 ring-primary ring-offset-2 ring-offset-card",
                )}
              >
                <p className="text-xs font-semibold">
                  {bloodLabel(item.bloodType)}
                </p>
                <p className="text-xl leading-tight font-bold tabular-nums">
                  {item.unitsAvailable}
                </p>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground">
            {lastUpdate
              ? `Updated ${timeAgo(lastUpdate)}`
              : "Stock not updated yet"}
          </p>
        </div>
      </div>

      {action && (
        <div className="mt-auto flex items-center justify-between gap-3 border-t bg-muted/30 px-5 py-3">
          {action}
        </div>
      )}
    </Card>
  );
}
