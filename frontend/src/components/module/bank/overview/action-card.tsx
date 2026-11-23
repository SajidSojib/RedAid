import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ActionCard({
  pending,
  approved,
}: {
  pending: number;
  approved: number;
}) {
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
          {pending > 0 && (
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-primary-foreground opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-primary-foreground" />
            </span>
          )}
          Waiting for your answer
        </p>
        <p className="text-7xl leading-none font-bold tracking-tight tabular-nums">
          {pending}
        </p>
        <p className="text-sm text-primary-foreground/70">
          {pending === 0
            ? "You're all caught up."
            : `request${pending === 1 ? "" : "s"} to review, oldest first`}
        </p>
      </div>

      <div className="space-y-4">
        <Link
          href="/dashboard/bank-requests?scope=approved"
          className="flex items-center justify-between rounded-xl bg-primary-foreground/10 px-4 py-3 text-sm backdrop-blur transition-colors hover:bg-primary-foreground/15"
        >
          <span className="text-primary-foreground/80">To be collected</span>
          <span className="font-semibold tabular-nums">{approved}</span>
        </Link>
        <Button
          variant="secondary"
          className="w-full"
          render={<Link href="/dashboard/bank-requests" />}
          nativeButton={false}
        >
          Review requests
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  );
}
