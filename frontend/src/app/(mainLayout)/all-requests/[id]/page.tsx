import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, MapPin, Phone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { bloodLabel } from "@/lib/blood";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  requestServices,
  type DonorRequestView,
} from "@/service/request.service";
import { userServices } from "@/service/user.service";
import { RequestStatusBadge, UrgencyBadge } from "@/components/module/user/my-requests/status-badges";
import { OfferActions } from "@/components/module/request/offer-actions";

export const metadata = { title: "Blood request · RedAid" };

const CLOSED_TEXT: Record<string, string> = {
  COMPLETED: "This request has been completed.",
  CANCELLED: "The requester cancelled this request.",
  EXPIRED: "This request expired without being completed.",
  FULFILLED:
    "All bags are claimed right now. If a donor drops out, a slot can open again.",
};

type Panel = {
  tone: "action" | "success" | "muted";
  title: string;
  text: string;
  showAccept: boolean;
  showDecline: boolean;
  showHistoryLink: boolean;
};

function describeOffer(request: DonorRequestView): Panel {
  const open = request.status === "OPEN";
  const place = request.hospitalName ?? "the hospital";
  const base = {
    showAccept: false,
    showDecline: false,
    showHistoryLink: false,
  };

  switch (request.myMatch.status) {
    case "ACCEPTED":
      return {
        ...base,
        tone: "success",
        title: "You've committed to donate",
        text: `Please go to ${place}. The requester confirms your donation afterwards, and you earn your point.`,
      };
    case "COMPLETED":
      return {
        ...base,
        tone: "success",
        title: "You donated for this request",
        text: "Thank you for saving a life. This donation is now part of your history.",
        showHistoryLink: true,
      };
    case "NO_SHOW":
      return {
        ...base,
        tone: "muted",
        title: "Marked as not showing up",
        text: "The requester marked that you didn't make it. If that's a mistake, please contact them directly.",
      };
    case "CANCELLED":
      return {
        ...base,
        tone: "muted",
        title: "You're no longer needed",
        text: "This request was closed before you donated.",
      };
    case "DECLINED":
      return open
        ? {
            ...base,
            tone: "action",
            title: "You declined this request",
            text: "Changed your mind? You can still help while it's open.",
            showAccept: true,
          }
        : {
            ...base,
            tone: "muted",
            title: "No longer open",
            text: CLOSED_TEXT[request.status] ?? "This request is closed.",
          };
    default: // NOTIFIED
      return open
        ? {
            ...base,
            tone: "action",
            title: "Can you help?",
            text: "You're being asked because you chose this area and your blood type is compatible.",
            showAccept: true,
            showDecline: true,
          }
        : {
            ...base,
            tone: "muted",
            title: "No longer open",
            text: CLOSED_TEXT[request.status] ?? "This request is closed.",
          };
  }
}

export default async function RequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: session } = await userServices.getSessionServer();
  const user = session?.user;

  if (!user) redirect(`/login?next=${encodeURIComponent(`/all-requests/${id}`)}`);

  // The backend only serves requests to donor and requester accounts
  if (user.role && user.role !== "USER") {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Blood request</h1>
        <p className="mt-2 text-muted-foreground">
          Requests are available to donor and requester accounts.
        </p>
      </main>
    );
  }

  const { data, error } = await requestServices.getRequestById(id);

  if (error?.status === 404) notFound();

  if (error || !data) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load this request</AlertTitle>
          <AlertDescription>
            {error?.message ?? "Something went wrong."}
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  // Requesters manage their requests from the dashboard
  if (data.viewer === "REQUESTER") {
    redirect(`/dashboard/my-requests?request=${id}`);
  }

  const request = data;
  const panel = describeOffer(request);
  const unlocked =
    request.myMatch.status === "ACCEPTED" ||
    request.myMatch.status === "COMPLETED";

  const place = request.union
    ? `${request.union.name}, ${request.upazila.name}`
    : `${request.upazila.name} (whole upazila)`;
  const percent = Math.min(
    100,
    Math.round((request.unitsAccepted / request.unitsNeeded) * 100),
  );
  const stillNeeded = request.unitsNeeded - request.unitsAccepted;

  return (
    <main className="container mx-auto max-w-2xl space-y-6 px-4 py-10">
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
                <RequestStatusBadge status={request.status} />
                <UrgencyBadge urgency={request.urgency} />
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

        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {request.unitsAccepted} of {request.unitsNeeded} donors committed
            </span>
            <span className="font-medium">
              {stillNeeded} bag{stillNeeded === 1 ? "" : "s"} needed
            </span>
          </div>
          <Progress value={percent} className="h-1.5" />
        </CardContent>
      </Card>

      <Card
        className={cn(
          panel.tone === "success" && "border-emerald-500/40 bg-emerald-500/5",
          panel.tone === "action" && "border-primary/40 bg-primary/5",
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {panel.tone === "success" && (
              <CheckCircle2 className="size-5 text-emerald-600" />
            )}
            {panel.title}
          </CardTitle>
          <CardDescription>{panel.text}</CardDescription>
        </CardHeader>

        {(panel.showAccept || panel.showHistoryLink) && (
          <CardContent>
            {panel.showAccept && (
              <OfferActions
                requestId={request.id}
                matchId={request.myMatch.id}
                hospitalName={request.hospitalName}
                canDecline={panel.showDecline}
              />
            )}
            {panel.showHistoryLink && (
              <Button
                variant="outline"
                render={<Link href="/dashboard/my-donations" />}
                nativeButton={false}
              >
                View my donations
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {unlocked && (request.patientName || request.contactPhone) && (
        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
            <CardDescription>
              Shared with you because you accepted this request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {request.patientName && (
              <p>
                <span className="text-muted-foreground">Patient:</span>{" "}
                <span className="font-medium">{request.patientName}</span>
              </p>
            )}
            {request.contactPhone && (
              <Button
                variant="outline"
                render={<a href={`tel:${request.contactPhone}`} />}
                nativeButton={false}
              >
                <Phone className="size-4" />
                Call {request.contactPhone}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {request.note && (
        <Card>
          <CardHeader>
            <CardTitle>Note from the requester</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {request.note}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
