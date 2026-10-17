"use client";

import { toast } from "sonner";
import { declineOffer } from "@/action/match.action";
import { DonateButton } from "./donate-button";
import { ConfirmAction } from "../../common/confirm-action";

export function OfferActions({
  requestId,
  matchId,
  hospitalName,
  canDecline,
}: {
  requestId: string;
  matchId: string;
  hospitalName: string | null;
  canDecline: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DonateButton requestId={requestId} hospitalName={hospitalName} />

      {canDecline && (
        <ConfirmAction
          label="I can't help"
          title="Decline this request?"
          description="The requester won't be told. You can still change your mind later while the request is open."
          confirmLabel="Decline"
          onConfirm={async () => {
            const { error } = await declineOffer(matchId);
            if (error) toast.error(error.message);
            else toast.success("Request declined");
          }}
        />
      )}
    </div>
  );
}