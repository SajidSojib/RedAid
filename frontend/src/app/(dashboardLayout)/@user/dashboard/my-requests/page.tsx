import { Suspense } from "react";
import Link from "next/link";
import { AlertCircle, ClipboardList, Building2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { requestServices } from "@/service/request.service";
import { bankRequestServices } from "@/service/bank-request.service";
import { MyRequestsList } from "@/components/module/user/my-requests/my-request-list";
import { RequestDialogs } from "@/components/module/user/my-requests/request-dialog";
import { BankRequestCard } from "@/components/module/user/my-requests/bank-request-card";
import { ListPagination } from "@/components/common/pagination";
import { cn } from "@/lib/utils";
import { RequestsToolbar } from "@/components/module/user/my-requests/requests-toolbar";

export const metadata = { title: "My requests · RedAid" };

const PAGE_SIZE = 8;
const BASE_PATH = "/dashboard/my-requests";

type SearchParams = Record<string, string | string[] | undefined>;

const text = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value.join(",") : (value ?? "");

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const type = text(params.type) === "bank" ? "bank" : "donor";
  const scope = text(params.scope) === "history" ? "history" : "active";
  const page = Math.max(1, Number(text(params.page)) || 1);
  const query = `scope=${scope}&page=${page}&limit=${PAGE_SIZE}`;

  const [donor, bank] = await Promise.all([
    type === "donor" ? requestServices.getMyRequests(query) : null,
    type === "bank" ? bankRequestServices.getMyBankRequests(query) : null,
  ]);

  const data = donor?.data ?? null;
  const bankData = bank?.data ?? null;
  const error = (donor ?? bank)?.error ?? null;

  const limitReached = data
    ? data.openRequests.used >= data.openRequests.limit
    : false;

  const paginationQuery = new URLSearchParams(
    type === "bank" ? { type: "bank" } : {},
  );
  if (scope === "history") paginationQuery.set("scope", "history");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">My requests</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            {type === "donor"
              ? "Track the blood requests you created, confirm donations, and close a request once you have what you need."
              : "Track the requests you sent to blood banks. You can have up to 3 active at a time."}
          </p>
          {data && (
            <p className="text-xs text-muted-foreground">
              {data.openRequests.used} of {data.openRequests.limit} open request
              slots used
              {limitReached && ". Cancel or complete one to add another."}
            </p>
          )}
          {bankData && (
            <p className="text-xs text-muted-foreground">
              {bankData.activeRequests.used} of {bankData.activeRequests.limit}{" "}
              active bank requests used
            </p>
          )}
        </div>

        {type === "donor" ? (
          limitReached ? (
            <Button disabled>New request</Button>
          ) : (
            <Button render={<Link href="/add-request" />} nativeButton={false}>
              New request
            </Button>
          )
        ) : (
          <Button render={<Link href="/blood-banks" />} nativeButton={false}>
            Find blood banks
          </Button>
        )}
      </header>

      <RequestsToolbar type={type} scope={scope} />

      {error || (!data && !bankData) ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load your requests</AlertTitle>
          <AlertDescription>
            {error?.message ?? "Something went wrong."}
          </AlertDescription>
        </Alert>
      ) : data ? (
        data.requests.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>
                {scope === "active"
                  ? "No active requests"
                  : "Nothing in your history yet"}
              </EmptyTitle>
              <EmptyDescription>
                {scope === "active"
                  ? "When you ask for blood, your request shows up here with the donors who respond."
                  : "Completed, cancelled and expired requests appear here."}
              </EmptyDescription>
            </EmptyHeader>
            {scope === "active" && !limitReached && (
              <EmptyContent>
                <Button
                  render={<Link href="/add-request" />}
                  nativeButton={false}
                >
                  Request blood
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <div className="space-y-4">
            <MyRequestsList requests={data.requests} />
            <ListPagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              limit={data.pagination.limit}
              query={paginationQuery}
              basePath={BASE_PATH}
            />
          </div>
        )
      ) : bankData && bankData.requests.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 />
            </EmptyMedia>
            <EmptyTitle>
              {scope === "active"
                ? "No active bank requests"
                : "Nothing in your history yet"}
            </EmptyTitle>
            <EmptyDescription>
              {scope === "active"
                ? "Ask a verified blood bank for blood and track it here."
                : "Completed, rejected and withdrawn requests appear here."}
            </EmptyDescription>
          </EmptyHeader>
          {scope === "active" && (
            <EmptyContent>
              <Button
                render={<Link href="/blood-banks" />}
                nativeButton={false}
              >
                Find blood banks
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : bankData ? (
        <div className="space-y-4">
          <ul className="space-y-4">
            {bankData.requests.map((request) => (
              <li key={request.id}>
                <BankRequestCard request={request} />
              </li>
            ))}
          </ul>
          <ListPagination
            page={bankData.pagination.page}
            totalPages={bankData.pagination.totalPages}
            total={bankData.pagination.total}
            limit={bankData.pagination.limit}
            query={paginationQuery}
            basePath={BASE_PATH}
          />
        </div>
      ) : null}

      {/* Always mounted, so a notification link opens the dialog even on an empty page */}
      {type === "donor" && (
        <Suspense fallback={null}>
          <RequestDialogs />
        </Suspense>
      )}
    </div>
  );
}
