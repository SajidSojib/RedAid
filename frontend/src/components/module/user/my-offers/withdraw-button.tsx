"use client";

import { toast } from "sonner";
import { withdrawOffer } from "@/action/match.action";
import { ConfirmAction } from "../my-requests/confirm-action";

export default function WithdrawButton({ matchId }: { matchId: string }) {
  return (
    <ConfirmAction
      label="Withdraw"
      destructive
      title="Withdraw from this request?"
      description="Your slot opens for other donors and the requester is told. You won't be able to accept this request again."
      confirmLabel="Yes, withdraw"
      onConfirm={async () => {
        const { error } = await withdrawOffer(matchId);
        if (error) toast.error(error.message);
        else toast.success("You withdrew from this request");
      }}
    />
  );
}
