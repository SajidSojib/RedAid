"use client";

import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { AdminBank } from "@/service/bank.service";

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "U";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium break-words">{children}</dd>
    </div>
  );
}

export function BankDetailsDialog({ bank }: { bank: AdminBank }) {
  const { owner, upazila } = bank;
  console.log(bank)

  return (
    <Dialog>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>
        <Eye className="size-4" />
        Details
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{bank?.name}</DialogTitle>
          <DialogDescription>
            Submitted {date(bank?.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-1">
          <h3 className="text-sm font-semibold">Blood bank</h3>
          <dl className="divide-y rounded-lg border px-3">
            <Row label="License number">
              <span className="font-mono">{bank?.licenseNumber}</span>
            </Row>
            <Row label="Phone">{bank?.phone}</Row>
            <Row label="Address">{bank.address}</Row>
            <Row label="Area">
              {upazila?.name}, {upazila?.district?.name},{" "}
              {upazila?.district?.division?.name}
            </Row>
            {bank?.latitude !== null && bank?.longitude !== null && (
              <Row label="Coordinates">
                {bank.latitude}, {bank.longitude}
              </Row>
            )}
            {bank?.verifiedAt && (
              <Row label="Verified on">{date(bank.verifiedAt)}</Row>
            )}
          </dl>
          {bank?.verificationNote && (
            <p className="rounded-lg border border-dashed bg-muted/40 p-3 text-sm">
              <span className="text-muted-foreground">Last note: </span>
              {bank?.verificationNote}
            </p>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Account owner</h3>
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage src={owner?.image ?? undefined} alt={owner?.name} />
              <AvatarFallback>{initials(owner?.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{owner?.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {owner?.email}
              </p>
            </div>
          </div>
          <dl className="divide-y rounded-lg border px-3">
            <Row label="Phone">{owner?.phone}</Row>
            <Row label="Email">
              {owner?.emailVerified ? (
                <Badge variant="secondary">Verified</Badge>
              ) : (
                <Badge variant="outline">Not verified</Badge>
              )}
            </Row>
            <Row label="Account">{owner?.status.toLowerCase()}</Row>
            <Row label="Joined">{date(owner?.createdAt)}</Row>
          </dl>
        </section>
      </DialogContent>
    </Dialog>
  );
}
