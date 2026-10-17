import type { ReactNode } from "react";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { bloodLabel } from "@/lib/blood";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { FeedRequest } from "@/service/request.service";
import { DonateButton } from "./donate-button";

const URGENCY = {
  CRITICAL: { label: "Critical", variant: "destructive", className: "" },
  URGENT: {
    label: "Urgent",
    variant: "outline",
    className:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  NORMAL: { label: "Normal", variant: "secondary", className: "" },
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
  const place = request.union
    ? `${request.union.name}, ${request.upazila.name}`
    : `${request.upazila.name} (whole upazila)`;
  const stillNeeded = request.unitsNeeded - request.unitsAccepted;
  const percent = Math.min(
    100,
    Math.round((request.unitsAccepted / request.unitsNeeded) * 100),
  );
  const action = renderAction(request, loggedIn, role, returnTo);

  return (
    <Card
      className={cn(
        request.urgency === "CRITICAL" && "border-l-4 border-l-destructive",
      )}
    >
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
            {bloodLabel(request.bloodType)}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="truncate">
                {request.hospitalName ?? "Hospital not specified"}
              </CardTitle>
              <Badge variant={urgency.variant} className={urgency.className}>
                {urgency.label}
              </Badge>
            </div>
            <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {place}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {timeAgo(request.createdAt)}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {request.unitsAccepted} of {request.unitsNeeded} donor
              {request.unitsNeeded === 1 ? "" : "s"} committed
            </span>
            <span className="font-medium">
              {stillNeeded} bag{stillNeeded === 1 ? "" : "s"} needed
            </span>
          </div>
          <Progress value={percent} className="h-1.5" />
        </div>

        {loggedIn ? (
          (request.patientName || request.note) && (
            <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
              {request.patientName && (
                <p>
                  <span className="text-muted-foreground">Patient:</span>{" "}
                  {request.patientName}
                </p>
              )}
              {request.note && (
                <p className="text-muted-foreground">{request.note}</p>
              )}
            </div>
          )
        ) : (
          <p className="text-xs text-muted-foreground">
            Log in to see patient details.
          </p>
        )}
      </CardContent>

      {action && <CardFooter className="border-t">{action}</CardFooter>}
    </Card>
  );
}
