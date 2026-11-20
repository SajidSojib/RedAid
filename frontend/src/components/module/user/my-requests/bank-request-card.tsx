import { Building2, Clock, Link2, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { bloodLabel } from "@/lib/blood";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import type {
  BankRequestStatus,
  MyBankRequest,
} from "@/service/bank-request.service";
import { WithdrawBankRequestButton } from "./withdraw-bank-request-button";

const STATUS: Record<
  BankRequestStatus,
  { label: string; chip: string; hint: string }
> = {
  PENDING: {
    label: "Pending",
    chip: "bg-amber-500/10 text-amber-600 ring-amber-500/30 dark:text-amber-400",
    hint: "Waiting for the bank to answer",
  },
  APPROVED: {
    label: "Approved",
    chip: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400",
    hint: "Contact the bank to collect it",
  },
  FULFILLED: {
    label: "Completed",
    chip: "bg-primary/10 text-primary ring-primary/30",
    hint: "You collected this blood",
  },
  REJECTED: {
    label: "Rejected",
    chip: "bg-destructive/10 text-destructive ring-destructive/30",
    hint: "The bank couldn't fulfil it",
  },
  NO_SHOW: {
    label: "Not collected",
    chip: "bg-destructive/10 text-destructive ring-destructive/30",
    hint: "The bank marked it as not collected",
  },
  CANCELLED: {
    label: "Closed",
    chip: "bg-muted text-muted-foreground ring-border",
    hint: "Closed because another bank approved you",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    chip: "bg-muted text-muted-foreground ring-border",
    hint: "You withdrew this request",
  },
};

export function BankRequestCard({ request }: { request: MyBankRequest }) {
  const ui = STATUS[request.status];
  const active = request.status === "PENDING" || request.status === "APPROVED";

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="space-y-3 p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/80 text-xl font-bold text-primary-foreground shadow-md">
            {bloodLabel(request.bloodType)}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">
                {request.unitsRequested} bag
                {request.unitsRequested === 1 ? "" : "s"}
              </h2>
              <Badge
                variant="outline"
                className={cn("border-transparent ring-1", ui.chip)}
              >
                {ui.label}
              </Badge>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="size-3.5 shrink-0" />
              <span className="truncate">{request.bank.name}</span>
            </p>
            {request.status === "APPROVED" && (
              <a
                href={`tel:${request.bank.phone}`}
                className="flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Phone className="size-3.5" />
                {request.bank.phone}
              </a>
            )}
          </div>

          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {timeAgo(request.createdAt)}
          </span>
        </div>

        {request.donationRequest && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link2 className="size-3.5" />
            Linked to your request
            {request.donationRequest.hospitalName && (
              <>
                {" "}
                at{" "}
                <span className="font-medium text-foreground">
                  {request.donationRequest.hospitalName}
                </span>
              </>
            )}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-5 py-3">
        <span className="text-sm text-muted-foreground">{ui.hint}</span>
        {active && (
          <WithdrawBankRequestButton
            id={request.id}
            approved={request.status === "APPROVED"}
          />
        )}
      </div>
    </Card>
  );
}
