import { AlertCircle, CalendarClock, Inbox } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { matchServices, type Offer } from "@/service/match.service";
import OfferScopeTabs from "@/components/module/user/my-offers/offer-scope-tabs";
import OfferCard from "@/components/module/user/my-offers/offer-card";
import { ListPagination } from "@/components/common/pagination";

export const metadata = { title: "My offers · RedAid" };

const SCOPES = ["pending", "accepted", "past"] as const;
type Scope = (typeof SCOPES)[number];

const EMPTY: Record<Scope, { title: string; text: string }> = {
  pending: {
    title: "No pending offers",
    text: "When a request matches your blood type and area, it shows up here.",
  },
  accepted: {
    title: "No accepted donations",
    text: "Offers you accept wait here until the requester confirms your donation.",
  },
  past: {
    title: "Nothing here yet",
    text: "Donated, declined and closed offers will appear here.",
  },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function MyOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; page?: string }>;
}) {
  const params = await searchParams;
  const scope: Scope = SCOPES.includes(params.scope as Scope)
    ? (params.scope as Scope)
    : "pending";
  const page = Math.max(1, Number(params.page) || 1);

  const { data, error } = await matchServices.getMyOffers(
    `scope=${scope}&page=${page}&limit=8`,
  );

  if (error || !data) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-3xl">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load your offers</AlertTitle>
        <AlertDescription>
          {error?.message ?? "Something went wrong."}
        </AlertDescription>
      </Alert>
    );
  }

  const { offers, counts, eligibility, pagination } = data;

  // Why this donor can't accept a pending offer right now, or null if they can
  const hintFor = (offer: Offer) => {
    if (offer.status !== "NOTIFIED") return null;
    if (!eligibility.eligible && eligibility.nextEligibleDate) {
      return `You can donate again on ${formatDate(eligibility.nextEligibleDate)}`;
    }
    if (counts.accepted > 0) return "Finish your accepted donation first.";
    if (offer.request.status !== "OPEN") {
      return "All bags are claimed right now. A slot may open if a donor drops out.";
    }
    return null;
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">My offers</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Requests sent to you because of your blood type and the areas you
          chose.
        </p>
      </header>

      {!eligibility.eligible && eligibility.nextEligibleDate && (
        <Alert className="border-primary/30 bg-primary/5">
          <CalendarClock className="size-4 text-primary" />
          <AlertTitle>You are resting after your last donation</AlertTitle>
          <AlertDescription>
            You can donate again on {formatDate(eligibility.nextEligibleDate)} (
            {eligibility.daysLeft} day{eligibility.daysLeft === 1 ? "" : "s"}{" "}
            left). You can still decline offers, but accepting is paused until
            then.
          </AlertDescription>
        </Alert>
      )}

      <OfferScopeTabs
        scope={scope}
        pending={counts.pending}
        accepted={counts.accepted}
      />

      {offers.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>{EMPTY[scope].title}</EmptyTitle>
            <EmptyDescription>{EMPTY[scope].text}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          <ul className="space-y-4">
            {offers.map((offer) => (
              <li key={offer.id}>
                <OfferCard offer={offer} hint={hintFor(offer)} />
              </li>
            ))}
          </ul>

          <ListPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            basePath="/dashboard/my-offers"
            query={new URLSearchParams(scope === "pending" ? {} : { scope })}
          />
        </div>
      )}
    </div>
  );
}
