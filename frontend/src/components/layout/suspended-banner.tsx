import { ShieldAlert } from "lucide-react";

export function SuspendedBanner({ reason }: { reason?: string | null }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
      <p>
        <span className="font-semibold">Your account is suspended.</span>{" "}
        <span className="text-muted-foreground">
          You can view your data but can&apos;t request or donate blood.
          {reason ? ` Reason: ${reason}` : ""}
        </span>
      </p>
    </div>
  );
}
