"use client";

import { Phone } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cancelMyRequest, completeMyRequest } from "@/action/request.action";
import { confirmDonation } from "@/action/donation.action";
import { markNoShow } from "@/action/match.action";
import { bloodLabel } from "@/lib/blood";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { MyRequestDetails, RequestDonor } from "@/service/request.service";
import { ConfirmAction } from "./confirm-action";
import { DIALOG_BASE } from "./dialog-params";
import { DialogError, DialogLoading } from "./dialog-states";
import {
  MatchStatusBadge,
  RequestStatusBadge,
  UrgencyBadge,
} from "./status-badges";
import { useRequestDetails } from "./user-request-details";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "D";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}

function donorTiming(item: RequestDonor) {
  if (item.status === "COMPLETED" && item.donatedAt)
    return `Donated ${timeAgo(item.donatedAt)}`;
  if (item.status === "ACCEPTED" && item.respondedAt)
    return `Accepted ${timeAgo(item.respondedAt)}`;
  if (item.status === "NO_SHOW" && item.respondedAt)
    return `Marked ${timeAgo(item.respondedAt)}`;
  return null;
}

export function RequestViewDialog({
  id,
  onClose,
  onEdit,
}: {
  id: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
}) {
  const { data, error, loading, reload } = useRequestDetails(id);

  const finish = async (
    failure: { message: string } | null,
    success: string,
  ) => {
    if (failure) {
      toast.error(failure.message);
      return;
    }
    toast.success(success);
    await reload();
  };

  const confirm = async (item: RequestDonor) => {
    const { data: result, error: failure } = await confirmDonation(
      item.matchId,
    );

    if (failure || !result) {
      toast.error(failure?.message ?? "Couldn't confirm this donation");
      return;
    }

    toast.success(
      result.requestCompleted
        ? "Donation confirmed. All bags are done, so the request is complete."
        : "Donation confirmed. Thank you!",
    );
    await reload();
  };

  const renderBody = (request: MyRequestDetails) => {
    const percent = Math.min(
      100,
      Math.round((request.unitsAccepted / request.unitsNeeded) * 100),
    );
    const district = request.upazila.district.name;
    const location = request.union
      ? `${request.union.name}, ${request.upazila.name}, ${district}`
      : `${request.upazila.name} (whole upazila), ${district}`;
    const { actions, stats } = request;

    return (
      <>
        <DialogHeader className="border-b p-4 pr-12 text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
              {bloodLabel(request.bloodType)}
            </div>
            <div className="min-w-0 space-y-1.5">
              <DialogTitle className="truncate">
                {request.hospitalName ?? "Hospital not specified"}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <RequestStatusBadge status={request.status} />
                <UrgencyBadge urgency={request.urgency} />
                <span>Created {timeAgo(request.createdAt)}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <section className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {request.unitsAccepted} of {request.unitsNeeded} donors
                committed
              </span>
              <span className="font-medium">
                {request.unitsNeeded} bag{request.unitsNeeded === 1 ? "" : "s"}{" "}
                needed
              </span>
            </div>
            <Progress value={percent} className="h-1.5" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Notified" value={stats.notified} />
              <Stat label="Waiting" value={stats.waiting} />
              <Stat label="Donated" value={stats.donated} />
              <Stat label="Didn't show up" value={stats.noShow} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Request details</h3>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Detail label="Patient" value={request.patientName} />
              <Detail label="Contact number" value={request.contactPhone} />
              <Detail label="Hospital" value={request.hospitalName} />
              <Detail label="Location" value={location} />
              {request.note && (
                <div className="sm:col-span-2">
                  <Detail label="Note" value={request.note} />
                </div>
              )}
            </dl>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Donors</h3>

            {request.donors.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                {stats.notified > 0
                  ? `${stats.notified} donor${stats.notified === 1 ? " was" : "s were"} notified. Nobody has accepted yet.`
                  : "No eligible donors were found in this area when the request was created."}
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {request.donors.map((item) => {
                  const timing = donorTiming(item);

                  return (
                    <li key={item.matchId} className="space-y-3 p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage
                            src={item.donor.image ?? undefined}
                            alt={item.donor.name}
                          />
                          <AvatarFallback className="text-xs">
                            {initials(item.donor.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.donor.name}
                            {item.donor.bloodType && (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                {bloodLabel(item.donor.bloodType)}
                              </span>
                            )}
                          </p>
                          {timing && (
                            <p className="text-xs text-muted-foreground">
                              {timing}
                            </p>
                          )}
                        </div>

                        <MatchStatusBadge status={item.status} />
                      </div>

                      {item.donor.phone && (
                        <a
                          href={`tel:${item.donor.phone}`}
                          className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                        >
                          <Phone className="size-3.5" />
                          {item.donor.phone}
                        </a>
                      )}

                      {actions.canManageDonors &&
                        item.status === "ACCEPTED" && (
                          <div className="flex flex-wrap gap-2">
                            <ConfirmAction
                              size="sm"
                              variant="default"
                              label="Confirm donation"
                              title={`Confirm that ${item.donor.name} donated?`}
                              description="This records the donation, gives them a point, and starts their 90-day wait before the next one. It can't be undone."
                              confirmLabel="Yes, they donated"
                              onConfirm={() => confirm(item)}
                            />
                            <ConfirmAction
                              size="sm"
                              label="Didn't show up"
                              destructive
                              title={`Mark ${item.donor.name} as not showing up?`}
                              description="Their slot opens again so another donor can accept. They won't count as committed anymore."
                              confirmLabel="Mark as no-show"
                              onConfirm={async () => {
                                const { error: failure } = await markNoShow(
                                  item.matchId,
                                );
                                await finish(
                                  failure,
                                  "Marked as didn't show up. The slot is open again.",
                                );
                              }}
                            />
                          </div>
                        )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {(actions.canEdit || actions.canComplete || actions.canCancel) && (
          <DialogFooter className="border-t p-4 sm:justify-between">
            <div>
              {actions.canEdit && (
                <Button variant="outline" onClick={() => onEdit(request.id)}>
                  Edit details
                </Button>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {actions.canCancel && (
                <ConfirmAction
                  label="Cancel request"
                  destructive
                  title="Cancel this request?"
                  description="Donors who accepted will be told it was cancelled. You can't undo this."
                  confirmLabel="Yes, cancel request"
                  onConfirm={async () => {
                    const { error: failure } = await cancelMyRequest(
                      request.id,
                    );
                    await finish(failure, "Request cancelled");
                  }}
                />
              )}

              {actions.canComplete && (
                <ConfirmAction
                  variant="default"
                  label="Mark as complete"
                  title="Mark this request as completed?"
                  description={`${
                    stats.waiting > 0
                      ? `${stats.waiting} donor${stats.waiting === 1 ? "" : "s"} who accepted but haven't donated will be released and told. `
                      : ""
                  }Use this when you got the blood you needed, including from other places. You can't undo this.`}
                  confirmLabel="Yes, mark completed"
                  onConfirm={async () => {
                    const { error: failure } = await completeMyRequest(
                      request.id,
                    );
                    await finish(failure, "Request marked as completed");
                  }}
                />
              )}
            </div>
          </DialogFooter>
        )}
      </>
    );
  };

  return (
    <Dialog open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(DIALOG_BASE, "sm:max-w-2xl")}>
        {data ? (
          renderBody(data)
        ) : error ? (
          <DialogError message={error} />
        ) : loading ? (
          <DialogLoading />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
