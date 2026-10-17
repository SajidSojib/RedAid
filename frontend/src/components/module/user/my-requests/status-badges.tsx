import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  MatchStatus,
  RequestStatus,
  RequestUrgency,
} from "@/service/request.service";

type Variant = "default" | "secondary" | "destructive" | "outline";

const GREEN =
  "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
const MUTED = "text-muted-foreground";

const REQUEST_STATUS: Record<
  RequestStatus,
  { label: string; variant: Variant; className?: string }
> = {
  OPEN: { label: "Open", variant: "default" },
  FULFILLED: { label: "All bags claimed", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "outline", className: GREEN },
  CANCELLED: { label: "Cancelled", variant: "outline", className: MUTED },
  EXPIRED: { label: "Expired", variant: "outline", className: MUTED },
};

const MATCH_STATUS: Record<
  MatchStatus,
  { label: string; variant: Variant; className?: string }
> = {
  NOTIFIED: { label: "Pending", variant: "outline", className: MUTED },
  ACCEPTED: { label: "Accepted", variant: "secondary" },
  COMPLETED: { label: "Donated", variant: "outline", className: GREEN },
  NO_SHOW: { label: "Didn't show up", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "outline", className: MUTED },
  DECLINED: { label: "Declined", variant: "outline", className: MUTED },
};

const URGENCY: Record<
  RequestUrgency,
  { label: string; variant: Variant; className?: string }
> = {
  CRITICAL: { label: "Critical", variant: "destructive" },
  URGENT: {
    label: "Urgent",
    variant: "outline",
    className:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  NORMAL: { label: "Normal", variant: "secondary" },
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const item = REQUEST_STATUS[status];
  return (
    <Badge variant={item.variant} className={cn(item.className)}>
      {item.label}
    </Badge>
  );
}

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const item = MATCH_STATUS[status];
  return (
    <Badge variant={item.variant} className={cn(item.className)}>
      {item.label}
    </Badge>
  );
}

export function UrgencyBadge({ urgency }: { urgency: RequestUrgency }) {
  const item = URGENCY[urgency];
  return (
    <Badge variant={item.variant} className={cn(item.className)}>
      {item.label}
    </Badge>
  );
}
