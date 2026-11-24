import Link from "next/link";
import {
  AlertCircle,
  Building,
  Landmark,
  Map,
  MapPin,
  MapPinned,
  type LucideIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAllDivisions,
  getDistrictsByDivisionId,
  getUpazilasByDistrictId,
} from "@/action/location.action";
import { ListPagination } from "@/components/common/pagination";
import { cn } from "@/lib/utils";
import { Level, locationServices } from "@/service/location.service";
import { AddLocationDialog, EditLocationDialog } from "@/components/module/admin/locations/location-dialogs";
import { LocationFilters } from "@/components/module/admin/locations/location-filters";

export const metadata = { title: "Locations · RedAid" };

const PAGE_SIZE = 15;
const BASE = "/dashboard/locations";

const TABS: {
  value: Level;
  label: string;
  child: string | null;
  icon: LucideIcon;
}[] = [
  { value: "division", label: "Divisions", child: "Districts", icon: Map },
  { value: "district", label: "Districts", child: "Upazilas", icon: Landmark },
  { value: "upazila", label: "Upazilas", child: "Unions", icon: Building },
  { value: "union", label: "Unions", child: null, icon: MapPin },
];

const KEYS = ["q", "divisionId", "districtId", "upazilaId"] as const;

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const level = TABS.find((t) => t.value === params.level)?.value ?? "division";
  const tab = TABS.find((t) => t.value === level)!;
  const page = Math.max(1, Number(params.page) || 1);

  const filters = new URLSearchParams({ level });
  for (const key of KEYS) if (params[key]) filters.set(key, params[key]!);

  const backend = new URLSearchParams(filters);
  backend.set("page", String(page));
  backend.set("limit", String(PAGE_SIZE));

  const [result, divisions, districts, upazilas] = await Promise.all([
    locationServices.listLocations(backend.toString()),
    getAllDivisions(),
    params.divisionId ? getDistrictsByDivisionId(params.divisionId) : null,
    params.districtId ? getUpazilasByDistrictId(params.districtId) : null,
  ]);

  const { data, error } = result;

  if (error || !data) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-3xl">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load locations</AlertTitle>
        <AlertDescription>
          {error?.message ?? "Something went wrong."}
        </AlertDescription>
      </Alert>
    );
  }

  const { rows, counts, pagination } = data;
  const total =
    counts.division + counts.district + counts.upazila + counts.union;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Edit names and add missing areas. Every selector on the site reads
            from here.
          </p>
        </div>
        <AddLocationDialog level={level} divisions={divisions.data ?? []} />
      </header>

      {/* Hero summary */}
      <section className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[2.5rem_2.5rem] opacity-60 mask-[radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-16 size-72 rounded-full bg-primary/20 blur-3xl"
        />

        <div className="relative grid gap-8 md:grid-cols-[1fr_20rem] md:items-center">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Areas in the system</p>
            <p className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-6xl font-bold tracking-tight text-transparent tabular-nums motion-safe:animate-gradient">
              {total.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Divisions, districts, upazilas and unions together.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.value}
                  href={`${BASE}?level=${t.value}`}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-background/60 p-3 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
                    level === t.value && "border-primary/40",
                  )}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.label}</p>
                    <p className="font-semibold tabular-nums">
                      {counts[t.value].toLocaleString()}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <nav
        aria-label="Level"
        className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/50 p-1"
      >
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`${BASE}?level=${t.value}`}
            aria-current={level === t.value ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all",
              level === t.value
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs tabular-nums",
                level === t.value ? "bg-primary/10 text-primary" : "bg-muted",
              )}
            >
              {counts[t.value]}
            </span>
          </Link>
        ))}
      </nav>

      <LocationFilters
        key={level}
        level={level}
        divisions={divisions.data ?? []}
        districts={districts?.data ?? []}
        upazilas={upazilas?.data ?? []}
      />

      <section className="space-y-3">
        {rows.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MapPinned />
              </EmptyMedia>
              <EmptyTitle>Nothing found</EmptyTitle>
              <EmptyDescription>
                Try another search, or add a new {level}.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <Card className="overflow-hidden py-0 transition-shadow hover:shadow-lg hover:shadow-primary/5">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Bengali
                    </TableHead>
                    {level !== "division" && (
                      <TableHead className="hidden md:table-cell">
                        Inside
                      </TableHead>
                    )}
                    {tab.child && (
                      <TableHead className="text-right">{tab.child}</TableHead>
                    )}
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {row.bn_name}
                      </TableCell>
                      {level !== "division" && (
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {row.parent}
                        </TableCell>
                      )}
                      {tab.child && (
                        <TableCell className="text-right tabular-nums">
                          {row.children}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <EditLocationDialog
                          key={row.id + row.name + row.bn_name}
                          level={level}
                          row={row}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <ListPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              query={filters}
              basePath={BASE}
            />
          </>
        )}
      </section>
    </div>
  );
}
