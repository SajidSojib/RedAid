import Link from "next/link";
import { AlertCircle, Crown, Medal, Trophy, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  getAllDivisions,
  getDistrictsByDivisionId,
  getUnionsByUpazilaId,
  getUpazilasByDistrictId,
} from "@/action/location.action";
import { cn } from "@/lib/utils";
import {
  leaderboardServices,
  type TopDonor,
} from "@/service/leaderboard.service";
import { ListPagination } from "@/components/common/pagination";
import { DonorFilters } from "@/components/module/top-donors/donor-filters";

export const metadata = { title: "Top donors · RedAid" };

const PAGE_SIZE = 20;
const AREA_KEYS = ["divisionId", "districtId", "upazilaId", "unionId"] as const;

type SearchParams = Record<string, string | string[] | undefined>;
const text = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";

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

// Reads 2nd, 1st, 3rd on wide screens
const PODIUM: Record<
  number,
  { order: string; lift: string; ring: string; avatar: string; tone: string }
> = {
  1: {
    order: "sm:order-2",
    lift: "sm:-translate-y-5",
    ring: "ring-amber-500/60",
    avatar: "size-24",
    tone: "text-amber-600 dark:text-amber-400",
  },
  2: {
    order: "sm:order-1",
    lift: "",
    ring: "ring-slate-400/60",
    avatar: "size-20",
    tone: "text-slate-500 dark:text-slate-300",
  },
  3: {
    order: "sm:order-3",
    lift: "",
    ring: "ring-orange-500/50",
    avatar: "size-20",
    tone: "text-orange-600 dark:text-orange-400",
  },
};

function BadgePill({ badge }: { badge: string | null }) {
  if (!badge) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 border-transparent", BADGE_CHIP[badge])}
    >
      <Medal className="size-3" />
      {title(badge)}
    </Badge>
  );
}

function PodiumCard({ donor }: { donor: TopDonor }) {
  const s = PODIUM[donor.rank];
  const first = donor.rank === 1;

  return (
    <Card
      className={cn(
        "group relative w-full overflow-hidden transition-all duration-300 hover:shadow-lg sm:w-1/3 sm:max-w-64",
        s.order,
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
            <AvatarImage src={donor.image ?? undefined} alt={donor.name} />
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
          <p className={cn("text-4xl font-bold tabular-nums", s.tone)}>
            {donor.donations}
          </p>
          <p className="text-xs text-muted-foreground">
            {donor.donations === 1 ? "donation" : "donations"}
          </p>
        </div>

        <BadgePill badge={donor.badge} />
      </CardContent>
    </Card>
  );
}

export default async function TopDonorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(text(params.page)) || 1);

  const areaParams = new URLSearchParams();
  for (const key of AREA_KEYS) {
    const value = text(params[key]);
    if (value) areaParams.set(key, value);
  }

  const backend = new URLSearchParams(areaParams);
  backend.set("page", String(page));
  backend.set("limit", String(PAGE_SIZE));

  const divisionId = text(params.divisionId);
  const districtId = text(params.districtId);
  const upazilaId = text(params.upazilaId);

  const [leaderboard, divisions, districts, upazilas, unions] =
    await Promise.all([
      leaderboardServices.getTopDonors(backend.toString()),
      getAllDivisions(),
      divisionId ? getDistrictsByDivisionId(divisionId) : null,
      districtId ? getUpazilasByDistrictId(districtId) : null,
      upazilaId ? getUnionsByUpazilaId(upazilaId) : null,
    ]);

  const options = {
    divisions: divisions.data ?? [],
    districts: districts?.data ?? [],
    upazilas: upazilas?.data ?? [],
    unions: unions?.data ?? [],
  };

  // Name of the deepest selected area, for the heading
  const areaName =
    options.unions.find((o) => o.id === text(params.unionId))?.name ??
    options.upazilas.find((o) => o.id === upazilaId)?.name ??
    options.districts.find((o) => o.id === districtId)?.name ??
    options.divisions.find((o) => o.id === divisionId)?.name ??
    null;

  const { data, error } = leaderboard;

  return (
    <main className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_at_top,black,transparent_65%)]"
      />
      <div
        aria-hidden
        className="absolute -top-24 left-1/2 -z-10 size-112 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="container mx-auto max-w-4xl space-y-8 px-4 py-10">
        <header className="space-y-3 text-center motion-safe:animate-fade-up">
          <Badge variant="outline" className="gap-1.5 py-1 pr-3 pl-2">
            <Trophy className="size-3.5 text-primary" />
            Leaderboard
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Top donors{" "}
            {areaName ? (
              <>
                in{" "}
                <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
                  {areaName}
                </span>
              </>
            ) : (
              <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
                across Bangladesh
              </span>
            )}
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            Every confirmed donation earns one point. Ties go to whoever got
            there first. Area filters show donors who serve that area.
          </p>
          {data && data.pagination.total > 0 && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              {data.pagination.total} donor
              {data.pagination.total === 1 ? "" : "s"} on the board
            </p>
          )}
        </header>

        <DonorFilters {...options} />

        {error || !data ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load the top donors</AlertTitle>
            <AlertDescription>
              {error?.message ?? "Something went wrong."}
            </AlertDescription>
          </Alert>
        ) : data.pagination.total === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Trophy />
              </EmptyMedia>
              <EmptyTitle>
                {areaName
                  ? `No donors in ${areaName} yet`
                  : "No donors on the board yet"}
              </EmptyTitle>
              <EmptyDescription>
                The first confirmed donation puts a donor here. It could be
                yours.
              </EmptyDescription>
            </EmptyHeader>
            {areaName && (
              <EmptyContent>
                <Button
                  variant="outline"
                  render={<Link href="/top-donors" />}
                  nativeButton={false}
                >
                  Clear filters
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <TopList data={data} page={page} areaParams={areaParams} />
        )}
      </div>
    </main>
  );
}

function TopList({
  data,
  page,
  areaParams,
}: {
  data: NonNullable<
    Awaited<ReturnType<typeof leaderboardServices.getTopDonors>>["data"]
  >;
  page: number;
  areaParams: URLSearchParams;
}) {
  const { donors, pagination } = data;
  const podium = page === 1 ? donors.slice(0, 3) : [];
  const rest = page === 1 ? donors.slice(3) : donors;

  return (
    <>
      {podium.length > 0 && (
        <section
          aria-label="Top three donors"
          className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:items-end sm:justify-center"
        >
          {podium.map((donor) => (
            <PodiumCard key={donor.rank} donor={donor} />
          ))}
        </section>
      )}

      {rest.length > 0 && (
        <section className="space-y-2">
          <ul className="space-y-2">
            {rest.map((donor) => (
              <li
                key={donor.rank}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
              >
                <span className="w-8 text-sm font-semibold text-muted-foreground tabular-nums">
                  #{donor.rank}
                </span>
                <Avatar className="size-9">
                  <AvatarImage
                    src={donor.image ?? undefined}
                    alt={donor.name}
                  />
                  <AvatarFallback className="text-xs">
                    {initials(donor.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {donor.name}
                </span>
                <span className="hidden sm:block">
                  <BadgePill badge={donor.badge} />
                </span>
                <span className="w-16 text-right font-semibold tabular-nums">
                  {donor.donations}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    pts
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ListPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        query={areaParams}
        basePath="/top-donors"
      />
    </>
  );
}
