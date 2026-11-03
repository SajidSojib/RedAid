import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { bloodLabel } from "@/lib/blood";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { requestServices } from "@/service/request.service";
import { URGENCY } from "@/components/module/request/request-card";

export function LiveRequestsFallback() {
  return (
    <section
      className="container mx-auto px-4 py-16 sm:px-6 md:py-24"
      aria-hidden
    >
      <div className="mx-auto mb-10 max-w-2xl space-y-3">
        <Skeleton className="mx-auto h-4 w-24" />
        <Skeleton className="mx-auto h-9 w-2/3" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </section>
  );
}

export async function LiveRequests() {
  const { data } = await requestServices.getRequests("page=1&limit=4");

  // Nothing open right now: skip the whole section
  if (!data || data.requests.length === 0) return null;

  const { requests, pagination } = data;

  return (
    <section className="relative isolate overflow-hidden border-y bg-muted/30">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <div className="container mx-auto px-4 py-16 sm:px-6 md:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Badge variant="outline" className="gap-2 py-1 pr-3 pl-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-primary opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Live now
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {pagination.total} open request
              {pagination.total === 1 ? "" : "s"}{" "}
              <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
                right now
              </span>
            </h2>
            <p className="max-w-xl text-muted-foreground">
              The newest people waiting for a donor. Log in to see details and
              respond.
            </p>
          </div>

          <Button
            variant="outline"
            render={<Link href="/all-requests" />}
            nativeButton={false}
          >
            See all requests
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {requests.map((request) => {
            const urgency = URGENCY[request.urgency];
            const critical = request.urgency === "CRITICAL";
            const stillNeeded = request.unitsNeeded - request.unitsAccepted;

            return (
              <li key={request.id}>
                <Link
                  href={`/all-requests/${request.id}`}
                  className="group block h-full"
                >
                  <Card className="relative h-full gap-4 overflow-hidden transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/10">
                    {critical && (
                      <div
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-destructive via-primary to-destructive"
                      />
                    )}

                    <CardContent className="flex h-full flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={cn(
                            "relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-lg font-bold text-primary-foreground shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3",
                            urgency.tile,
                          )}
                        >
                          {bloodLabel(request.bloodType)}
                          {critical && (
                            <span className="absolute -top-1 -right-1 flex size-3">
                              <span className="absolute inline-flex size-full rounded-full bg-destructive opacity-75 motion-safe:animate-ping" />
                              <span className="relative inline-flex size-3 rounded-full border-2 border-card bg-destructive" />
                            </span>
                          )}
                        </div>

                        {request.urgency !== "NORMAL" && (
                          <Badge
                            variant={urgency.variant}
                            className={urgency.className}
                          >
                            {urgency.label}
                          </Badge>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-semibold">
                          {request.hospitalName ?? "Hospital not specified"}
                        </p>
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {request.upazila.name},{" "}
                            {request.upazila.district.name}
                          </span>
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3 shrink-0" />
                          {timeAgo(request.createdAt)}
                        </p>
                      </div>

                      <div className="mt-auto space-y-2">
                        <div className="flex gap-1" aria-hidden>
                          {Array.from(
                            { length: request.unitsNeeded },
                            (_, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "h-1.5 flex-1 rounded-full",
                                  i < request.unitsAccepted
                                    ? "bg-primary"
                                    : "bg-muted",
                                )}
                              />
                            ),
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground tabular-nums">
                            {stillNeeded}
                          </span>{" "}
                          bag{stillNeeded === 1 ? "" : "s"} still needed
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
