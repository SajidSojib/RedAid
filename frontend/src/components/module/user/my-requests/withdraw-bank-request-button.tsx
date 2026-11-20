"use client";

import { toast } from "sonner";
import { ConfirmAction } from "@/components/common/confirm-action";
import { withdrawBankRequest } from "@/action/bank-request.action";

export function WithdrawBankRequestButton({
  id,
  approved,
}: {
  id: string;
  approved: boolean;
}) {
  return (
    <ConfirmAction
      size="sm"
      label="Withdraw"
      destructive
      title="Withdraw this request?"
      description={
        approved
          ? "The bank already approved it. It will be told you no longer need it. You can't undo this."
          : "The bank will be told you no longer need it. You can't undo this."
      }
      confirmLabel="Yes, withdraw"
      onConfirm={async () => {
        const { error } = await withdrawBankRequest(id);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Request withdrawn");
      }}
    />
  );
}
