import { Suspense } from "react";
import Link from "next/link";
import { AlertCircle, SearchX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SidebarInset } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAllDivisions,
  getDistrictsByDivisionId,
  getUnionsByUpazilaId,
  getUpazilasByDistrictId,
} from "@/action/location.action";
import { requestServices } from "@/service/request.service";
import { userServices } from "@/service/user.service";
import { RequestCard } from "@/components/module/request/request-card";
import { RequestPagination } from "@/components/module/request/request-pagination";
import { RequestsShell } from "@/components/module/request/request-shell";
import { RequestFilters } from "@/components/module/request/request-filters";
import { FiltersToggle } from "@/components/module/request/filters-toggle";
import { ActiveFilters } from "@/components/module/request/active-filters";

export const metadata = { title: "Blood requests · RedAid" };

const FILTER_KEYS = [
  "bloodType",
  "urgency",
  "divisionId",
  "districtId",
  "upazilaId",
  "unionId",
] as const;
const PAGE_SIZE = 12;

type SearchParams = Record<string, string | string[] | undefined>;

const text = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value.join(",") : (value ?? "");

const count = (value: string) => value.split(",").filter(Boolean).length;

function ResultsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex gap-4">
              <Skeleton className="size-14 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-9 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function RequestResults({
  backendQuery,
  filterParams,
  page,
}: {
  backendQuery: string;
  filterParams: URLSearchParams;
  page: number;
}) {
  const [{ data, error }, { data: session }] = await Promise.all([
    requestServices.getRequests(backendQuery),
    userServices.getSessionServer(),
  ]);

  const user = session?.user;

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load requests</AlertTitle>
        <AlertDescription>
          <p>{error?.message ?? "Something went wrong."}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            render={<Link href="/all-requests" />}
            nativeButton={false}
          >
            Clear filters and retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const { requests, pagination } = data;

  if (requests.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>No open requests match</EmptyTitle>
          <EmptyDescription>
            Try removing a filter, or check back soon. New requests appear here
            as soon as they are created.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            render={<Link href="/all-requests" />}
            nativeButton={false}
          >
            Clear filters
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const params = new URLSearchParams(filterParams);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  const returnTo = qs ? `/all-requests?${qs}` : "/all-requests";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {pagination.total} open request{pagination.total === 1 ? "" : "s"}
      </p>

      <ul className="space-y-4">
        {requests.map((request) => (
          <li key={request.id}>
            <RequestCard
              request={request}
              loggedIn={Boolean(user)}
              role={user?.role ?? null}
              returnTo={returnTo}
            />
          </li>
        ))}
      </ul>

      <RequestPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        query={filterParams}
      />
    </div>
  );
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const filterParams = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = text(params[key]);
    if (value) filterParams.set(key, value);
  }

  const page = Math.max(1, Number(text(params.page)) || 1);

  const backendParams = new URLSearchParams(filterParams);
  backendParams.set("page", String(page));
  backendParams.set("limit", String(PAGE_SIZE));

  const divisionId = text(params.divisionId);
  const districtId = text(params.districtId);
  const upazilaId = text(params.upazilaId);

  const activeCount =
    count(text(params.bloodType)) +
    count(text(params.urgency)) +
    (filterParams.has("divisionId") ||
    filterParams.has("districtId") ||
    filterParams.has("upazilaId") ||
    filterParams.has("unionId")
      ? 1
      : 0);

  // Every id is in the URL, so all four lists load in parallel
  const [divisions, districts, upazilas, unions] = await Promise.all([
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

  return (
    <RequestsShell>
        <RequestFilters {...options} />

        <SidebarInset>
          <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Blood requests
                </h1>
                <p className="max-w-xl text-sm text-muted-foreground">
                  People who need blood right now. If you are eligible and your
                  blood type matches, you can respond.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FiltersToggle activeCount={activeCount} />
                <Button
                  render={<Link href="/requests/new" />}
                  nativeButton={false}
                >
                  Request blood
                </Button>
              </div>
            </header>

            <ActiveFilters params={filterParams} {...options} />

            <Suspense
              key={`${filterParams.toString()}|${page}`}
              fallback={<ResultsSkeleton />}
            >
              <RequestResults
                backendQuery={backendParams.toString()}
                filterParams={filterParams}
                page={page}
              />
            </Suspense>
          </div>
        </SidebarInset>
    </RequestsShell>
  );
}
