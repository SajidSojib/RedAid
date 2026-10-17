import { Suspense } from "react";
import Link from "next/link";
import { AlertCircle, ClipboardList } from "lucide-react";
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
import { RequestScopeTabs } from "@/components/module/user/my-requests/request-scope-tabs";
import { MyRequestsList } from "@/components/module/user/my-requests/my-request-list";
import { RequestPagination } from "@/components/module/request/request-pagination";
import { RequestDialogs } from "@/components/module/user/my-requests/request-dialog";

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

  const scope = text(params.scope) === "history" ? "history" : "active";
  const page = Math.max(1, Number(text(params.page)) || 1);

  const { data, error } = await requestServices.getMyRequests(
    `scope=${scope}&page=${page}&limit=${PAGE_SIZE}`,
  );

  const limitReached = data
    ? data.openRequests.used >= data.openRequests.limit
    : false;
  const paginationQuery = new URLSearchParams(
    scope === "history" ? { scope: "history" } : {},
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">My requests</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Track the blood requests you created, confirm donations, and close a
            request once you have what you need.
          </p>
          {data && (
            <p className="text-xs text-muted-foreground">
              {data.openRequests.used} of {data.openRequests.limit} open request
              slots used
              {limitReached && ". Cancel or complete one to add another."}
            </p>
          )}
        </div>

        {limitReached ? (
          <Button disabled>New request</Button>
        ) : (
          <Button render={<Link href="/add-request" />} nativeButton={false}>
            New request
          </Button>
        )}
      </header>

      <RequestScopeTabs scope={scope} />

      {error || !data ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load your requests</AlertTitle>
          <AlertDescription>
            {error?.message ?? "Something went wrong."}
          </AlertDescription>
        </Alert>
      ) : data.requests.length === 0 ? (
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
          <RequestPagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            query={paginationQuery}
            basePath={BASE_PATH}
          />
        </div>
      )}

      {/* Always mounted, so a notification link opens the dialog even on an empty page */}
      <Suspense fallback={null}>
        <RequestDialogs />
      </Suspense>
    </div>
  );
}
