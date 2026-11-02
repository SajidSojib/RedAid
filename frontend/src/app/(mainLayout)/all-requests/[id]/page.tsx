import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Droplet,
  HeartHandshake,
  Info,
  MapPin,
  MessageSquareQuote,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { URGENCY } from "@/components/module/request/request-card";
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

const TONE = {
  action: {
    icon: HeartHandshake,
    card: "border-primary/40 bg-primary/5",
    chip: "bg-primary/10 text-primary",
  },
  success: {
    icon: CheckCircle2,
    card: "border-emerald-500/40 bg-emerald-500/5",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  muted: {
    icon: Info,
    card: "border-dashed bg-muted/30",
    chip: "bg-muted text-muted-foreground",
  },
} as const;

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
    case "WITHDRAWN":
      return {
        ...base,
        tone: "muted",
        title: "You withdrew from this request",
        text: "You can't accept this request again. Other requests may still need you.",
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

  if (!user)
    redirect(`/login?next=${encodeURIComponent(`/all-requests/${id}`)}`);

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
  const tone = TONE[panel.tone];
  const ToneIcon = tone.icon;
  const urgency = URGENCY[request.urgency];
  const critical = request.urgency === "CRITICAL";
  const unlocked =
    request.myMatch.status === "ACCEPTED" ||
    request.myMatch.status === "COMPLETED";

  const place = request.union
    ? `${request.union.name}, ${request.upazila.name}, ${request.upazila.district.name}`
    : `${request.upazila.name} (whole upazila), ${request.upazila.district.name}`;
  const stillNeeded = request.unitsNeeded - request.unitsAccepted;

  return (
    <main className="relative isolate overflow-hidden ">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_at_top,black,transparent_65%)]"
      />
      <div
        aria-hidden
        className="absolute -top-24 left-1/2 -z-10 size-112 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="container mx-auto max-w-2xl space-y-6 px-4 py-10">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          render={<Link href="/all-requests" />}
          nativeButton={false}
        >
          <ArrowLeft className="size-4" />
          All requests
        </Button>

        {/* summary */}
        <Card className="relative gap-5 overflow-hidden shadow-lg motion-safe:animate-fade-up">
          {critical && (
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-destructive via-primary to-destructive"
            />
          )}

          <CardHeader>
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "relative flex size-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-2xl font-bold text-primary-foreground shadow-md",
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

              <div className="min-w-0 flex-1 space-y-2">
                <CardTitle className="text-xl">
                  {request.hospitalName ?? "Hospital not specified"}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
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
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Droplet className="size-3.5 text-primary" />
                {request.unitsAccepted} of {request.unitsNeeded} committed
              </span>
              <span className="font-medium">
                {stillNeeded} bag{stillNeeded === 1 ? "" : "s"} needed
              </span>
            </div>
            <div className="flex gap-1" aria-hidden>
              {Array.from({ length: request.unitsNeeded }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2 flex-1 rounded-full",
                    i < request.unitsAccepted ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* what the donor can do now */}
        <Card
          style={{ animationDelay: "100ms" }}
          className={cn("motion-safe:animate-fade-up", tone.card)}
        >
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full",
                  tone.chip,
                )}
              >
                <ToneIcon className="size-5" />
              </div>
              <div className="space-y-1">
                <CardTitle>{panel.title}</CardTitle>
                <CardDescription>{panel.text}</CardDescription>
              </div>
            </div>

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
        </Card>

        {/* unlocked after accepting */}
        {unlocked && (request.patientName || request.contactPhone) && (
          <Card
            style={{ animationDelay: "200ms" }}
            className="motion-safe:animate-fade-up"
          >
            <CardHeader>
              <CardTitle>Contact details</CardTitle>
              <CardDescription>
                Shared with you because you accepted this request.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.patientName && (
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Patient</p>
                  <p className="font-medium">{request.patientName}</p>
                </div>
              )}
              {request.contactPhone && (
                <Button
                  className="w-full shadow-md shadow-primary/20 sm:w-auto"
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
          <Card
            style={{ animationDelay: "300ms" }}
            className="motion-safe:animate-fade-up"
          >
            <CardContent className="flex gap-3">
              <MessageSquareQuote className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Note from the requester</p>
                <p className="text-sm text-muted-foreground">{request.note}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}