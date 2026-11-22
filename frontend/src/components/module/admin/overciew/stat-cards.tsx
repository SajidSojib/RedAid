import {
  Building2,
  Droplet,
  ShieldOff,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminOverview } from "@/service/overview.service";

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  bad,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint?: string;
  bad?: boolean;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full ring-1 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6",
          bad
            ? "bg-destructive/10 text-destructive ring-destructive/30"
            : "bg-primary/10 text-primary ring-primary/20",
        )}
      >
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-3xl leading-none font-bold tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
      </div>
    </div>
  );
}

export function StatCards({ counts }: { counts: AdminOverview["counts"] }) {
  const suspended = counts.users.suspended + counts.banks.SUSPENDED;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        icon={Droplet}
        label="Donations confirmed"
        value={counts.donations}
      />
      <Stat icon={Users} label="Active users" value={counts.users.active} />
      <Stat
        icon={Building2}
        label="Verified banks"
        value={counts.banks.VERIFIED}
        hint={`${counts.activeBankRequests} active bank requests`}
      />
      <Stat
        icon={ShieldOff}
        label="Suspended accounts"
        value={suspended}
        hint={`${counts.users.suspended} users · ${counts.banks.SUSPENDED} banks`}
        bad={suspended > 0}
      />
    </section>
  );
}
