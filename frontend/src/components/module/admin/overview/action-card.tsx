import Link from "next/link";

export function ActionCard({
  banks,
  reports,
}: {
  banks: number;
  reports: number;
}) {
  const total = banks + reports;

  return (
    <section className="relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/20 motion-safe:animate-fade-up">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--primary-foreground)_10%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--primary-foreground)_10%,transparent)_1px,transparent_1px)] bg-size-[2.5rem_2.5rem] mask-[radial-gradient(ellipse_at_top_right,black,transparent_75%)]"
      />
      <div
        aria-hidden
        className="absolute -right-16 -bottom-20 -z-10 size-64 rounded-full bg-primary-foreground/10 blur-3xl"
      />

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm text-primary-foreground/80">
          {total > 0 && (
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-primary-foreground opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-primary-foreground" />
            </span>
          )}
          Waiting for a decision
        </p>
        <p className="text-7xl leading-none font-bold tracking-tight tabular-nums">
          {total}
        </p>
        <p className="text-sm text-primary-foreground/70">
          {total === 0
            ? "Everything is reviewed."
            : "bank registrations and reports to review"}
        </p>
      </div>

      <div className="space-y-3">
        {[
          {
            href: "/dashboard/bank-management?status=PENDING",
            label: "Banks to verify",
            value: banks,
          },
          {
            href: "/dashboard/users?view=reported",
            label: "Reports to review",
            value: reports,
          },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center justify-between rounded-xl bg-primary-foreground/10 px-4 py-3 text-sm backdrop-blur transition-colors hover:bg-primary-foreground/15"
          >
            <span className="text-primary-foreground/80">{l.label}</span>
            <span className="font-semibold tabular-nums">{l.value}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
