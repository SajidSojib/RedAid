import { Clock, Droplet, PackageCheck } from "lucide-react";
import type { BankOverview } from "@/service/overview.service";

export function SummaryCards({
  counts,
  total,
}: {
  counts: BankOverview["counts"];
  total: number;
}) {
  const items = [
    { label: "Bags given", value: counts.bagsGiven, icon: Droplet },
    {
      label: "Requests completed",
      value: counts.fulfilled,
      icon: PackageCheck,
    },
    { label: "Bags in stock", value: total, icon: Clock },
  ];

  return (
    <section className="space-y-3 motion-safe:animate-fade-up">
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="group flex items-center gap-4 rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-3xl leading-none font-bold tabular-nums">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
