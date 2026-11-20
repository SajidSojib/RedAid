"use client";

import type { ReactNode } from "react";
import { Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { bloodLabel } from "@/lib/blood";
import { timeAgo } from "@/lib/time";
import type { LinkedRequest } from "@/service/bank-request.service";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium wrap-break-word">{children}</dd>
    </div>
  );
}

export function LinkedRequestDialog({ request }: { request: LinkedRequest }) {
  const place = request.union
    ? `${request.union.name}, ${request.upazila.name}, ${request.upazila.district.name}`
    : `${request.upazila.name}, ${request.upazila.district.name}`;

  return (
    <Dialog>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>
        <Link2 className="size-4" />
        View request
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Linked request</DialogTitle>
          <DialogDescription>
            The requester linked this to their own request, so you can see what
            the blood is for.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/80 text-xl font-bold text-primary-foreground">
            {bloodLabel(request.bloodType)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {request.hospitalName ?? "Hospital not specified"}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="capitalize">
                {request.status.toLowerCase()}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {request.urgency.toLowerCase()}
              </Badge>
            </div>
          </div>
        </div>

        <dl className="divide-y rounded-lg border px-3">
          <Row label="Bags needed">{request.unitsNeeded}</Row>
          <Row label="Donors committed">
            {request.unitsAccepted} of {request.unitsNeeded}
          </Row>
          <Row label="Patient">{request.patientName ?? "Not shared"}</Row>
          <Row label="Contact">
            {request.contactPhone ? (
              <a
                href={`tel:${request.contactPhone}`}
                className="hover:text-primary"
              >
                {request.contactPhone}
              </a>
            ) : (
              "Not shared"
            )}
          </Row>
          <Row label="Area">{place}</Row>
          <Row label="Posted">{timeAgo(request.createdAt)}</Row>
        </dl>

        {request.note && (
          <p className="rounded-lg border border-dashed bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">Note: </span>
            {request.note}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
