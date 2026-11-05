import type { ReactNode } from "react";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { bloodLabel } from "@/lib/blood";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { FeedRequest } from "@/service/request.service";
import { DonateButton } from "./donate-button";

export const URGENCY = {
  CRITICAL: {
    label: "Critical",
    variant: "destructive",
    className: "",
    tile: "from-destructive to-primary",
  },
  URGENT: {
    label: "Urgent",
    variant: "outline",
    className:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    tile: "from-amber-500 to-primary",
  },
  NORMAL: {
    label: "Normal",
    variant: "secondary",
    className: "",
    tile: "from-primary to-primary/80",
  },
} as const;

function detailsLink(id: string, label: string) {
  return (
    <Button
      variant="outline"
      size="sm"
      render={<Link href={`/all-requests/${id}`} />}
      nativeButton={false}
    >
      {label}
    </Button>
  );
}

// Returns null when there's nothing to show, so the card skips its footer
function renderAction(
  request: FeedRequest,
  loggedIn: boolean,
  role: string | null,
  returnTo: string,
): ReactNode {
  const viewer = request.viewer;

  if (!loggedIn) {
    return (
      <Button
        variant="outline"
        render={<Link href={`/login?next=${encodeURIComponent(returnTo)}`} />}
        nativeButton={false}
      >
        Log in to donate
      </Button>
    );
  }

  // Banks and admins can browse but don't donate
  if (role !== "USER" || !viewer) return null;

  if (viewer.isOwner) {
    return (
      <div className="flex w-full items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          This is your request
        </span>
        {detailsLink(request.id, "Manage")}
      </div>
    );
  }

  if (viewer.matchStatus === "ACCEPTED" || viewer.matchStatus === "COMPLETED") {
    return (
      <div className="flex w-full items-center justify-between gap-3">
        <span className="text-sm font-medium text-primary">
          {viewer.matchStatus === "COMPLETED"
            ? "You donated for this request"
            : "You accepted this request"}
        </span>
        {detailsLink(request.id, "View details")}
      </div>
    );
  }

  if (viewer.canRespond) {
    return (
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        {viewer.matchStatus === "NOTIFIED" ? (
          <Badge variant="outline" className="text-primary">
            You were notified
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Can you help?</span>
        )}
        <DonateButton
          requestId={request.id}
          hospitalName={request.hospitalName}
        />
      </div>
    );
  }

  return (
    <p className="line-clamp-2 text-xs text-muted-foreground">
      {viewer.blockedReason}
    </p>
  );
}

export function RequestCard({
  request,
  loggedIn,
  role,
  returnTo,
}: {
  request: FeedRequest;
  loggedIn: boolean;
  role: string | null;
  returnTo: string;
}) {
  const urgency = URGENCY[request.urgency];
  const critical = request.urgency === "CRITICAL";
  const place = `${request.upazila.name}, ${request.upazila.district.name}`;
  const fullPlace = request.union ? `${request.union.name}, ${place}` : place;
  const stillNeeded = request.unitsNeeded - request.unitsAccepted;
  const action = renderAction(request, loggedIn, role, returnTo);

  return (
    <Card className="group relative h-full gap-0 overflow-hidden py-0 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
      {critical && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-destructive via-primary to-destructive"
        />
      )}

      <div className="flex gap-4 p-5">
        <div
          className={cn(
            "relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-xl font-bold text-primary-foreground shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3",
            urgency.tile,
          )}
        >
          {bloodLabel(request.bloodType)}
          {critical && (
            <span className="absolute -top-1 -right-1 flex size-3">
              <span className="absolute inline-flex size-full rounded-full bg-destructive opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-3 rounded-full border-2 border-card bg-destructive" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/all-requests/${request.id}`}
                className="block text-xl leading-tight font-semibold tracking-tight after:absolute after:inset-0"
              >
                {stillNeeded} bag{stillNeeded === 1 ? "" : "s"} needed
              </Link>
              <p className="truncate text-sm text-muted-foreground">
                {request.hospitalName ?? "Hospital not specified"}
              </p>
            </div>

            {request.urgency !== "NORMAL" && (
              <Badge variant={urgency.variant} className={urgency.className}>
                {urgency.label}
              </Badge>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex gap-1" aria-hidden>
              {Array.from({ length: request.unitsNeeded }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i < request.unitsAccepted ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              {request.unitsAccepted} of {request.unitsNeeded} donors committed
            </p>
          </div>

          <p className="flex items-center gap-x-3 text-xs text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1" title={fullPlace}>
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{place}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <Clock className="size-3" />
              {timeAgo(request.createdAt)}
            </span>
          </p>
        </div>
      </div>

      {action && (
        <div className="relative z-10 mt-auto flex border-t bg-muted/30 px-5 py-3">
          {action}
        </div>
      )}
    </Card>
  );
}