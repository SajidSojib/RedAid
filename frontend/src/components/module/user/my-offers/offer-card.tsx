import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
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
import type { Offer } from "@/service/match.service";
import WithdrawButton from "./withdraw-button";
import { MatchStatusBadge, UrgencyBadge } from "../my-requests/status-badges";
import { OfferActions } from "../../request/offer-actions";

const PAST_TEXT: Partial<Record<Offer["status"], string>> = {
  COMPLETED: "You donated for this request. Thank you for saving a life.",
  DECLINED: "You declined this request.",
  NO_SHOW: "The requester marked that you didn't make it.",
  WITHDRAWN: "You withdrew from this request.",
  CANCELLED: "This request was closed before you donated.",
};

export default function OfferCard({
  offer,
  hint,
}: {
  offer: Offer;
  hint: string | null; // why accepting is paused, or null when the donor can accept
}) {
  const { request } = offer;
  const live = offer.status === "NOTIFIED" || offer.status === "ACCEPTED";
  const place = request.union
    ? `${request.union.name}, ${request.upazila.name}`
    : `${request.upazila.name} (whole upazila)`;
  const percent = Math.min(
    100,
    Math.round((request.unitsAccepted / request.unitsNeeded) * 100),
  );

  return (
    <Card>
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
              <UrgencyBadge urgency={request.urgency} />
              {!live && <MatchStatusBadge status={offer.status} />}
            </div>
            <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {place}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                Offered {timeAgo(offer.notifiedAt)}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {live ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {request.unitsAccepted} of {request.unitsNeeded} donors
                committed
              </span>
              <span className="font-medium">
                {request.unitsNeeded - request.unitsAccepted} bag
                {request.unitsNeeded - request.unitsAccepted === 1
                  ? ""
                  : "s"}{" "}
                needed
              </span>
            </div>
            <Progress value={percent} className="h-1.5" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {PAST_TEXT[offer.status]}
          </p>
        )}

        {offer.status === "ACCEPTED" && (
          <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
            <p className="font-medium">
              Please go to {request.hospitalName ?? "the hospital"}
            </p>
            {request.patientName && (
              <p className="text-muted-foreground">
                Patient: {request.patientName}
              </p>
            )}
            {request.contactPhone && (
              <Button
                variant="outline"
                size="sm"
                render={<a href={`tel:${request.contactPhone}`} />}
                nativeButton={false}
              >
                <Phone className="size-4" />
                Call {request.contactPhone}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              The requester confirms your donation after you donate.
            </p>
          </div>
        )}
      </CardContent>

      {live && (
        <CardFooter className="flex-wrap items-center justify-between gap-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/all-requests/${request.id}`} />}
            nativeButton={false}
          >
            Details
          </Button>

          {offer.status === "NOTIFIED" ? (
            <div className="flex flex-wrap items-center gap-3">
              {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
              <OfferActions
                requestId={request.id}
                matchId={offer.id}
                hospitalName={request.hospitalName}
                canDecline
                canAccept={!hint}
              />
            </div>
          ) : (
            <WithdrawButton matchId={offer.id} />
          )}
        </CardFooter>
      )}
    </Card>
  );
}
