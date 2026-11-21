import { ShieldAlert } from "lucide-react";

export function SuspendedNotice({ reason }: { reason: string | null }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div>
        <p className="font-semibold">Your bank is suspended</p>
        <p className="text-muted-foreground">
          It is hidden from requesters. You can view your data but not change
          it.
          {reason ? ` Reason: ${reason}` : ""} Contact an admin if you think
          this is a mistake.
        </p>
      </div>
    </div>
  );
}
