"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader, ShieldOff, Undo2 } from "lucide-react";
import { toast } from "sonner";
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
import { ConfirmAction } from "@/components/common/confirm-action";
import {
  reinstateBank,
  rejectBank,
  suspendBank,
  verifyBank,
} from "@/action/bank.action";
import type { VerificationStatus } from "@/service/bank.service";

type Result = Promise<{ error: { message: string } | null }>;

function NoteDialog({
  label,
  title,
  description,
  placeholder,
  success,
  run,
  icon,
}: {
  label: string;
  title: string;
  description: string;
  placeholder: string;
  success: string;
  run: (note: string) => Result;
  icon: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      const { error } = await run(note);
      if (error) {
        toast.error(error.message);
        return;
      }
      setOpen(false);
      setNote("");
      toast.success(success);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
          />
        }
      >
        {icon}
        {label}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description} The owner sees your reason.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          maxLength={300}
          placeholder={placeholder}
        />
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={pending || note.trim().length < 5}
          >
            {pending && <Loader className="animate-spin" />}
            {label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BankReviewActions({
  bankId,
  bankName,
  status,
}: {
  bankId: string;
  bankName: string;
  status: VerificationStatus;
}) {
  if (status === "SUSPENDED") {
    return (
      <ConfirmAction
        size="sm"
        variant="default"
        label="Reinstate"
        title={`Reinstate ${bankName}?`}
        description="The bank is verified and public again. Requests cancelled by the suspension are not restored."
        confirmLabel="Yes, reinstate"
        onConfirm={async () => {
          const { error } = await reinstateBank(bankId);
          if (error) {
            toast.error(error.message);
            return;
          }
          toast.success("Bank reinstated");
        }}
      />
    );
  }

  return (
    <div className="flex gap-2">
      {status !== "VERIFIED" && (
        <ConfirmAction
          size="sm"
          variant="default"
          label="Verify"
          title={`Verify ${bankName}?`}
          description="The bank becomes visible to requesters and its owner is notified. Check the license number first."
          confirmLabel="Yes, verify"
          onConfirm={async () => {
            const { error } = await verifyBank(bankId);
            if (error) {
              toast.error(error.message);
              return;
            }
            toast.success(`${bankName} is now verified`);
          }}
        />
      )}

      {status === "VERIFIED" && (
        <NoteDialog
          label="Suspend"
          icon={<ShieldOff className="size-4" />}
          title={`Suspend ${bankName}`}
          description="It is hidden from the public and open requests are cancelled. The owner can still log in and view, but not change anything."
          placeholder="e.g. Several requesters reported unavailable stock."
          success="Bank suspended"
          run={(note) => suspendBank(bankId, note)}
        />
      )}

      {status !== "REJECTED" && (
        <NoteDialog
          label={status === "VERIFIED" ? "Revoke" : "Reject"}
          icon={<Undo2 className="size-4" />}
          title={`${status === "VERIFIED" ? "Revoke verification of" : "Reject"} ${bankName}`}
          description="The owner can edit their details and submit again."
          placeholder="e.g. The license number could not be verified."
          success={
            status === "VERIFIED" ? "Verification revoked" : "Bank rejected"
          }
          run={(note) => rejectBank(bankId, note)}
        />
      )}
    </div>
  );
}
