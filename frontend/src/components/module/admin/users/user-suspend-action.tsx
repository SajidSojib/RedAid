"use client";

import { useState, useTransition } from "react";
import { Loader, ShieldOff } from "lucide-react";
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
import { reactivateUser, suspendUser } from "@/action/admin-user.action";

export function UserSuspendActions({
  userId,
  userName,
  suspended,
}: {
  userId: string;
  userName: string;
  suspended: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  if (suspended) {
    return (
      <ConfirmAction
        size="sm"
        variant="default"
        label="Reactivate"
        title={`Reactivate ${userName}?`}
        description="They can request and donate again. Requests and offers cancelled by the suspension are not restored."
        confirmLabel="Yes, reactivate"
        onConfirm={async () => {
          const { error } = await reactivateUser(userId);
          if (error) {
            toast.error(error.message);
            return;
          }
          toast.success("Account reactivated");
        }}
      />
    );
  }

  const submit = () =>
    startTransition(async () => {
      const { error } = await suspendUser(userId, note);
      if (error) {
        toast.error(error.message);
        return;
      }
      setOpen(false);
      setNote("");
      toast.success("Account suspended");
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
        <ShieldOff className="size-4" />
        Suspend
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend {userName}</DialogTitle>
          <DialogDescription>
            They can still log in and view their data, but can&apos;t request or
            donate. Their open requests, accepted offers and active bank
            requests are cancelled, and pending reports are marked as handled.
            They see your reason.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          maxLength={300}
          placeholder="e.g. Several donors reported fake requests."
        />
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={pending || note.trim().length < 5}
          >
            {pending && <Loader className="animate-spin" />}
            Suspend account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
