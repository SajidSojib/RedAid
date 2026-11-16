"use client";

import { useState, useTransition } from "react";
import { Check, Loader, PackageCheck, UserX, X } from "lucide-react";
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
  approveBankRequest,
  completeBankRequest,
  markBankRequestNoShow,
  rejectBankRequest,
} from "@/action/bank-request.action";
import type { BankRequestStatus } from "@/service/bank-request.service";

type Run = (id: string) => Promise<{ error: { message: string } | null }>;

function Confirm({
  id,
  label,
  icon,
  title,
  text,
  success,
  run,
  variant = "default",
  disabled,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  success: string;
  run: Run;
  variant?: "default" | "outline" | "destructive";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const go = () => {
    startTransition(async () => {
      const { error } = await run(id);
      setOpen(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(success);
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            size="sm"
            variant={variant === "destructive" ? "outline" : variant}
            disabled={disabled}
            className={
              variant === "destructive"
                ? "text-destructive hover:text-destructive"
                : undefined
            }
          />
        }
      >
        {icon}
        {label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{text}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            onClick={go}
            disabled={pending}
            variant={variant === "destructive" ? "destructive" : "default"}
          >
            {pending && <Loader className="animate-spin" />}
            {label}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function IncomingRequestActions({
  id,
  status,
  enoughStock,
}: {
  id: string;
  status: BankRequestStatus;
  enoughStock: boolean;
}) {
  if (status === "PENDING") {
    return (
      <div className="flex gap-2">
        <Confirm
          id={id}
          label="Reject"
          variant="destructive"
          icon={<X className="size-4" />}
          title="Reject this request?"
          text="The requester is notified that you can't fulfil it."
          success="Request rejected"
          run={rejectBankRequest}
        />
        <Confirm
          id={id}
          label="Approve"
          disabled={!enoughStock}
          icon={<Check className="size-4" />}
          title="Approve this request?"
          text="The requester is told to collect the blood, and their other pending requests at other banks are closed."
          success="Request approved"
          run={approveBankRequest}
        />
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <div className="flex gap-2">
        <Confirm
          id={id}
          label="No-show"
          variant="outline"
          icon={<UserX className="size-4" />}
          title="Mark as not collected?"
          text="Use this if the requester never came. Your stock is not changed."
          success="Marked as a no-show"
          run={markBankRequestNoShow}
        />
        <Confirm
          id={id}
          label="Complete"
          disabled={!enoughStock}
          icon={<PackageCheck className="size-4" />}
          title="Complete this request?"
          text="The requester collected the blood. The bags are deducted from your inventory."
          success="Request completed"
          run={completeBankRequest}
        />
      </div>
    );
  }

  return null;
}
