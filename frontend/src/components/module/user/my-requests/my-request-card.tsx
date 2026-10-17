"use client";

import { Clock, MapPin } from "lucide-react";
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
import type { MyRequest } from "@/service/request.service";
import { RequestStatusBadge, UrgencyBadge } from "./status-badges";

function historySummary(request: MyRequest) {
  switch (request.status) {
    case "COMPLETED":
      return `${request.donors.donated} of ${request.unitsNeeded} bag${request.unitsNeeded === 1 ? "" : "s"} donated through RedAid`;
    case "CANCELLED":
      return "You cancelled this request";
    default:
      return "No donor responded in time";
  }
}

export function MyRequestCard({
  request,
  onView,
  onEdit,
}: {
  request: MyRequest;
  onView: () => void;
  onEdit: () => void;
}) {
  const isActive = request.status === "OPEN" || request.status === "FULFILLED";
  const place = request.union
    ? `${request.union.name}, ${request.upazila.name}`
    : `${request.upazila.name} (whole upazila)`;
  const percent = Math.min(
    100,
    Math.round((request.unitsAccepted / request.unitsNeeded) * 100),
  );

  return (
    <Card
      className={cn(
        isActive &&
          request.urgency === "CRITICAL" &&
          "border-l-4 border-l-destructive",
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
              <RequestStatusBadge status={request.status} />
              {isActive && <UrgencyBadge urgency={request.urgency} />}
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

      <CardContent>
        {isActive ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {request.unitsAccepted} of {request.unitsNeeded} donors
                committed
              </span>
              <span className="font-medium">
                {request.donors.donated} donated · {request.donors.waiting}{" "}
                waiting
              </span>
            </div>
            <Progress value={percent} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {request._count.matches} donor
              {request._count.matches === 1 ? " was" : "s were"} notified
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {historySummary(request)}
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2 border-t">
        <Button size="sm" variant="outline" onClick={onView}>
          View
        </Button>
        {isActive && (
          <Button size="sm" variant="outline" onClick={onEdit}>
            Edit
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
