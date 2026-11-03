import Link from "next/link";
import { ArrowRight, Crown, Medal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { leaderboardServices } from "@/service/leaderboard.service";

const title = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "D";

// Direct colors, each with a dark variant
const BADGE_CHIP: Record<string, string> = {
  BRONZE: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  SILVER: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  GOLD: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DIAMOND: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  PLATINUM: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

// Reads 2nd, 1st, 3rd on wider screens
const PODIUM: Record<
  number,
  {
    order: string;
    lift: string;
    ring: string;
    avatar: string;
    tone: string;
    delay: number;
  }
> = {
  1: {
    order: "sm:order-2",
    lift: "sm:-translate-y-5",
    ring: "ring-amber-500/60",
    avatar: "size-24",
    tone: "text-amber-600 dark:text-amber-400",
    delay: 0,
  },
  2: {
    order: "sm:order-1",
    lift: "",
    ring: "ring-slate-400/60",
    avatar: "size-20",
    tone: "text-slate-500 dark:text-slate-300",
    delay: 150,
  },
  3: {
    order: "sm:order-3",
    lift: "",
    ring: "ring-orange-500/50",
    avatar: "size-20",
    tone: "text-orange-600 dark:text-orange-400",
    delay: 300,
  },
};

export function TopDonorsPreviewFallback() {
  return (
    <section
      className="container mx-auto px-4 py-16 sm:px-6 md:py-24"
      aria-hidden
    >
      <div className="mx-auto mb-10 max-w-2xl space-y-3">
        <Skeleton className="mx-auto h-4 w-24" />
        <Skeleton className="mx-auto h-9 w-2/3" />
      </div>
      <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-56 flex-1 rounded-xl" />
        ))}
      </div>
    </section>
  );
}

export async function TopDonorsPreview() {
  const { data } = await leaderboardServices.getTopDonors("page=1&limit=3");

  // Fewer than 3 donors: skip the whole section
  if (!data || data.donors.length < 3) return null;

  return (
    <section className="container mx-auto px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
        <p className="text-sm font-medium tracking-wider text-primary uppercase">
          Leaderboard
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Meet our{" "}
          <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
            top donors
          </span>
        </h2>
        <p className="text-muted-foreground">
          The people who have given the most blood through RedAid. Every
          confirmed donation earns one point.
        </p>
      </div>

      <ol className="mx-auto flex max-w-4xl flex-col items-center gap-6 sm:gap-10 sm:flex-row sm:items-end sm:justify-center">
        {data.donors.map((donor) => {
          const s = PODIUM[donor.rank];
          if (!s) return null;
          const first = donor.rank === 1;

          return (
            <li
              key={donor.rank}
              style={{ animationDelay: `${s.delay}ms` }}
              className={cn(
                "w-full motion-safe:animate-fade-up sm:w-1/3 sm:max-w-64",
                s.order,
              )}
            >
              <Card
                className={cn(
                  "group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
                  s.lift,
                  first && "border-primary/40 shadow-lg shadow-primary/10",
                )}
              >
                {first && (
                  <div
                    aria-hidden
                    className="absolute -top-16 left-1/2 size-40 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
                  />
                )}

                <CardContent className="relative flex flex-col items-center gap-3 text-center">
                  <div className="relative">
                    <Avatar
                      className={cn(
                        "ring-2 ring-offset-2 ring-offset-card transition-transform duration-300 group-hover:scale-105",
                        s.avatar,
                        s.ring,
                      )}
                    >
                      <AvatarImage
                        src={donor.image ?? undefined}
                        alt={donor.name}
                      />
                      <AvatarFallback className="text-lg">
                        {initials(donor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border bg-card text-sm font-bold shadow",
                        s.tone,
                      )}
                    >
                      {first ? <Crown className="size-4" /> : donor.rank}
                    </span>
                  </div>

                  <div className="w-full space-y-0.5">
                    <p className="truncate font-semibold">{donor.name}</p>
                    <p
                      className={cn("text-4xl font-bold tabular-nums", s.tone)}
                    >
                      {donor.donations}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {donor.donations === 1 ? "donation" : "donations"}
                    </p>
                  </div>

                  {donor.badge && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1 border-transparent",
                        BADGE_CHIP[donor.badge],
                      )}
                    >
                      <Medal className="size-3" />
                      {title(donor.badge)}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>

      <div className="mt-12 flex justify-center">
        <Button
          variant="outline"
          size="lg"
          render={<Link href="/top-donors" />}
          nativeButton={false}
        >
          See the full leaderboard
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  );
}
