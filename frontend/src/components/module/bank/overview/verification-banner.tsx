import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BankOverview } from "@/service/overview.service";
import { SuspendedNotice } from "../bank-profile/suspended-notice";

export function VerificationBanner({ bank }: { bank: BankOverview["bank"] }) {
  if (bank.verificationStatus === "VERIFIED") return null;
  if (bank.verificationStatus === "SUSPENDED") {
    return <SuspendedNotice reason={bank.suspensionReason} />;
  }

  const rejected = bank.verificationStatus === "REJECTED";

  return (
    <Link
      href="/dashboard/bank-profile"
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-sm transition-colors hover:bg-muted/40 motion-safe:animate-fade-up",
        rejected
          ? "border-destructive/30 bg-destructive/5"
          : "border-amber-500/30 bg-amber-500/5",
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex-1">
        <p className="font-semibold">
          {rejected
            ? "Your bank was not approved"
            : "Your bank is waiting for review"}
        </p>
        <p className="text-muted-foreground">
          {rejected
            ? `${bank.verificationNote ?? "No reason was given."} Update your details to submit again.`
            : "Requesters can't see it until an admin verifies it."}
        </p>
      </div>
      <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
