"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, Loader, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { VerificationStatus } from "@/service/bank.service";
import { rejectBank, verifyBank } from "@/action/bank.action";

export function BankReviewActions({
  bankId,
  bankName,
  status,
}: {
  bankId: string;
  bankName: string;
  status: VerificationStatus;
}) {
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const verify = () => {
    startTransition(async () => {
      const { error } = await verifyBank(bankId);
      setVerifyOpen(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`${bankName} is now verified`);
    });
  };

  const reject = () => {
    startTransition(async () => {
      const { error } = await rejectBank(bankId, note);
      if (error) {
        toast.error(error.message);
        return;
      }
      setRejectOpen(false);
      setNote("");
      toast.success(
        status === "VERIFIED" ? "Verification revoked" : "Bank rejected",
      );
    });
  };

  const revoking = status === "VERIFIED";

  return (
    <>
      {status !== "VERIFIED" && (
        <AlertDialog open={verifyOpen} onOpenChange={setVerifyOpen}>
          <AlertDialogTrigger render={<Button size="sm" />}>
            <BadgeCheck className="size-4" />
            Verify
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Verify {bankName}?</AlertDialogTitle>
              <AlertDialogDescription>
                The bank becomes visible to requesters and its owner is
                notified. Check the license number and details first.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
              <Button onClick={verify} disabled={pending}>
                {pending && <Loader className="animate-spin" />}
                Yes, verify
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {status !== "REJECTED" && (
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogTrigger
            render={
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
              />
            }
          >
            <ShieldOff className="size-4" />
            {revoking ? "Revoke" : "Reject"}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {revoking ? "Revoke verification" : "Reject"} · {bankName}
              </DialogTitle>
              <DialogDescription>
                {revoking
                  ? "The bank is hidden from requesters right away."
                  : "The owner can edit their details and submit again."}{" "}
                The owner sees your reason.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. The license number could not be verified."
              rows={4}
              maxLength={300}
            />
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={reject}
                disabled={pending || note.trim().length < 5}
              >
                {pending && <Loader className="animate-spin" />}
                {revoking ? "Revoke verification" : "Reject bank"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
