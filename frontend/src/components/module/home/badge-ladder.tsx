import Link from "next/link";
import { ArrowRight, Award, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MILESTONES } from "@/constants/milestones";
import { cn } from "@/lib/utils";
import CertificateDialog from "../user/my-donations/certificate-dialog";
import { env } from "@/env";

// One color per level, with dark mode handled
const TIER: Record<string, { chip: string; glow: string; bar: string }> = {
  BRONZE: {
    chip: "bg-orange-500/10 text-orange-600 ring-orange-500/30 dark:text-orange-400",
    glow: "group-hover:shadow-orange-500/25",
    bar: "from-orange-500/70 to-orange-500/0",
  },
  SILVER: {
    chip: "bg-slate-500/10 text-slate-600 ring-slate-500/30 dark:text-slate-300",
    glow: "group-hover:shadow-slate-500/25",
    bar: "from-slate-500/70 to-slate-500/0",
  },
  GOLD: {
    chip: "bg-amber-500/10 text-amber-600 ring-amber-500/30 dark:text-amber-400",
    glow: "group-hover:shadow-amber-500/25",
    bar: "from-amber-500/70 to-amber-500/0",
  },
  DIAMOND: {
    chip: "bg-sky-500/10 text-sky-600 ring-sky-500/30 dark:text-sky-400",
    glow: "group-hover:shadow-sky-500/25",
    bar: "from-sky-500/70 to-sky-500/0",
  },
  PLATINUM: {
    chip: "bg-violet-500/10 text-violet-600 ring-violet-500/30 dark:text-violet-400",
    glow: "group-hover:shadow-violet-500/25",
    bar: "from-violet-500/70 to-violet-500/0",
  },
};

// Static class names so Tailwind can see them: each step is taller than the last
const STEP_HEIGHT = [
  "lg:min-h-48",
  "lg:min-h-56",
  "lg:min-h-64",
  "lg:min-h-72",
  "lg:min-h-80",
];

const title = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

export function BadgeLadder() {
  return (
    <section className="relative isolate overflow-hidden border-y bg-muted/30">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <div className="container mx-auto px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
          <p className="text-sm font-medium tracking-wider text-primary uppercase">
            Recognition
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Every donation moves you{" "}
            <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
              up the ladder
            </span>
          </h2>
          <p className="text-muted-foreground">
            One confirmed donation is one point. Reach a milestone to earn a
            badge, and from Silver upward a certificate with a QR code anyone
            can verify.
          </p>
        </div>

        <ol className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end lg:gap-4">
          {MILESTONES.map((m, i) => {
            const tier = TIER[m.badge];

            return (
              <li
                key={m.badge}
                style={{ animationDelay: `${i * 100}ms` }}
                className={cn(
                  "motion-safe:animate-fade-up",
                  i === MILESTONES.length - 1 && "sm:col-span-2 lg:col-span-1",
                )}
              >
                <div
                  className={cn(
                    "group relative flex h-full flex-col items-center justify-between gap-4 overflow-hidden rounded-2xl border bg-card p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl",
                    tier?.glow,
                    STEP_HEIGHT[i],
                  )}
                >
                  <div
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0 top-0 h-16 bg-linear-to-b opacity-20 transition-opacity duration-300 group-hover:opacity-40",
                      tier?.bar,
                    )}
                  />

                  <div
                    className={cn(
                      "relative flex size-16 items-center justify-center rounded-full ring-1 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6",
                      tier?.chip,
                    )}
                  >
                    <Medal className="size-8" strokeWidth={1.6} />
                  </div>

                  <div className="relative space-y-1">
                    <p className="text-lg font-semibold">{title(m.badge)}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground tabular-nums">
                        {m.count}
                      </span>{" "}
                      donation{m.count === 1 ? "" : "s"}
                    </p>
                  </div>

                  {m.certificate ? (
                    <div className="relative">
                      <CertificateDialog
                        demo
                        donorName="Your Name"
                        badge={m.badge}
                        donations={m.count}
                        awardedAt="2026-01-15T00:00:00.000Z"
                        certificateId="a1b2c3d4-sample"
                        verifyUrl={env.NEXT_PUBLIC_FRONTEND_URL}
                      />
                    </div>
                  ) : (
                    <span className="relative text-xs text-muted-foreground">
                      Your first badge
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-12 flex justify-center">
          <Button
            size="lg"
            render={<Link href="/all-requests" />}
            nativeButton={false}
          >
            Start earning badges
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
