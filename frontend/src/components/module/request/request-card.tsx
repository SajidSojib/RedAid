import type { ReactNode } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
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
    <p className="text-sm text-muted-foreground">{viewer.blockedReason}</p>
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
  console.log(fullPlace)
  const stillNeeded = request.unitsNeeded - request.unitsAccepted;
  const action = renderAction(request, loggedIn, role, returnTo);

  return (
    <Card className="group relative h-full gap-4 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
      {critical && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-destructive via-primary to-destructive"
        />
      )}

      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-lg font-bold text-primary-foreground shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3",
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

          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">
              {request.hospitalName ?? "Hospital not specified"}
            </CardTitle>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate" title={fullPlace}>
                {place}
              </span>
              <span aria-hidden>·</span>
              <span className="shrink-0">{timeAgo(request.createdAt)}</span>
            </p>
          </div>

          {request.urgency !== "NORMAL" && (
            <Badge variant={urgency.variant} className={urgency.className}>
              {urgency.label}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
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
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">
            {request.unitsAccepted}/{request.unitsNeeded}
          </span>{" "}
          committed · {stillNeeded} bag{stillNeeded === 1 ? "" : "s"} needed
        </p>
      </CardContent>

      {action && (
        <CardFooter className="mt-auto border-t bg-muted/30 py-3">
          {action}
        </CardFooter>
      )}
    </Card>
  );
}
