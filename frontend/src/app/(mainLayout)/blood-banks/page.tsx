import { AlertCircle, Building2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  getAllDivisions,
  getDistrictsByDivisionId,
  getUpazilasByDistrictId,
} from "@/action/location.action";
import { ListPagination } from "@/components/common/pagination";
import { bankServices } from "@/service/bank.service";
import { bankRequestServices } from "@/service/bank-request.service";
import { userServices } from "@/service/user.service";
import { BankFilters } from "@/components/module/blood-banks/bank-filters";
import { BankCard } from "@/components/module/blood-banks/bank-card";
import { requestServices } from "@/service/request.service";

export const metadata = { title: "Blood banks · RedAid" };

const PAGE_SIZE = 10;
const KEYS = ["divisionId", "districtId", "upazilaId", "bloodType"] as const;

type SearchParams = Record<string, string | string[] | undefined>;
const text = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";

export default async function BloodBanksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(text(params.page)) || 1);

  const filterParams = new URLSearchParams();
  for (const key of KEYS) {
    const value = text(params[key]);
    if (value) filterParams.set(key, value);
  }

  const backend = new URLSearchParams(filterParams);
  backend.set("page", String(page));
  backend.set("limit", String(PAGE_SIZE));

  const divisionId = text(params.divisionId);
  const districtId = text(params.districtId);

  const [banks, divisions, districts, upazilas, { data: session }] =
    await Promise.all([
      bankServices.getBanks(backend.toString()),
      getAllDivisions(),
      divisionId ? getDistrictsByDivisionId(divisionId) : null,
      districtId ? getUpazilasByDistrictId(districtId) : null,
      userServices.getSessionServer(),
    ]);

  const user = session?.user;
  const { data, error } = banks;
  const qs = filterParams.toString();
  const returnTo = qs ? `/blood-banks?${qs}` : "/blood-banks";

  const [mine, donorRequests] =
    user?.role === "USER"
      ? await Promise.all([
          bankRequestServices.getMyBankRequests("scope=active&limit=10"),
          requestServices.getMyRequests("scope=active&limit=10"),
        ])
      : [null, null];

  const myRequests = mine?.data
    ? {
        count: mine.data.activeRequests.used,
        limit: mine.data.activeRequests.limit,
        byBank: Object.fromEntries(
          mine.data.requests.map((r) => [r.bankId, r.status]),
        ),
        openRequests: (donorRequests?.data?.requests ?? []).map((r) => ({
          id: r.id,
          bloodType: r.bloodType,
          hospitalName: r.hospitalName,
        })),
      }
    : undefined;
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

      <div className="container mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        <header className="space-y-3 text-center motion-safe:animate-fade-up">
          <Badge variant="outline" className="gap-1.5 py-1 pr-3 pl-2">
            <Building2 className="size-3.5 text-primary" />
            Verified banks
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Blood{" "}
            <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
              banks
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            Every bank here was checked by an admin. See what is in stock and
            request blood directly.
          </p>
        </header>

        <BankFilters
          divisions={divisions.data ?? []}
          districts={districts?.data ?? []}
          upazilas={upazilas?.data ?? []}
        />

        {error || !data ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load blood banks</AlertTitle>
            <AlertDescription>
              {error?.message ?? "Something went wrong."}
            </AlertDescription>
          </Alert>
        ) : data.banks.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 />
              </EmptyMedia>
              <EmptyTitle>No blood banks match</EmptyTitle>
              <EmptyDescription>
                Try another area or blood type. Banks appear here after an admin
                verifies them.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <ul className="grid gap-4 lg:grid-cols-2">
              {data.banks.map((bank) => (
                <li key={bank.id}>
                  <BankCard
                    bank={bank}
                    role={user?.role ?? null}
                    loggedIn={Boolean(user)}
                    bloodType={text(params.bloodType) || undefined}
                    returnTo={returnTo}
                    myRequests={myRequests}
                  />
                </li>
              ))}
            </ul>

            <ListPagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              limit={data.pagination.limit}
              query={filterParams}
              basePath="/blood-banks"
            />
          </>
        )}
      </div>
    </main>
  );
}
