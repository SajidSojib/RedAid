"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
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
import { volunteerForRequest } from "@/action/match.action";

export function DonateButton({
  requestId,
  hospitalName,
}: {
  requestId: string;
  hospitalName: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const donate = () => {
    startTransition(async () => {
      const { error } = await volunteerForRequest(requestId);
      setOpen(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Thank you! The requester has been notified.", {
        action: {
          label: "View details",
          onClick: () => router.push(`/all-requests/${requestId}`),
        },
      });
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button />}>I can donate</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Donate one bag of blood?</AlertDialogTitle>
          <AlertDialogDescription>
            You are committing to donate one bag
            {hospitalName ? ` at ${hospitalName}` : ""}. The requester is
            notified and their contact details unlock for you. If you can not make
            it, please let them know.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Not now</AlertDialogCancel>
          <Button onClick={donate} disabled={pending}>
            {pending && <Loader className="animate-spin" />}
            Yes, I will donate
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
