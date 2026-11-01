import { authedRequest } from "@/lib/server-api";
import type { MatchStatus, RequestStatus, RequestUrgency } from "./request.service";

type Ref = { id: string; name: string; bn_name: string };

export type Offer = {
  id: string; // the match id
  status: MatchStatus;
  notifiedAt: string;
  respondedAt: string | null;
  request: {
    id: string;
    bloodType: string;
    unitsNeeded: number;
    unitsAccepted: number;
    urgency: RequestUrgency;
    status: RequestStatus;
    hospitalName: string | null;
    patientName: string | null;
    contactPhone?: string | null; // only present once the donor accepted
    createdAt: string;
    upazila: Ref;
    union: Ref | null;
  };
};

export type OffersPayload = {
  offers: Offer[];
  counts: { pending: number; accepted: number };
  eligibility: { eligible: boolean; nextEligibleDate: string | null; daysLeft: number };
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

const getMyOffers = (query: string) =>
  authedRequest<OffersPayload>(`/matches/my-offers${query ? `?${query}` : ""}`, {
    cache: { revalidate: 15, tags: ["my-offers"] },
  });

const withdrawOffer = (matchId: string) =>
  authedRequest<unknown>(`/matches/${encodeURIComponent(matchId)}/withdraw`, {
    method: "PATCH",
  });

const volunteerForRequest = (requestId: string) =>
  authedRequest<unknown>(
    `/matches/requests/${encodeURIComponent(requestId)}/volunteer`,
    { method: "POST" },
  );

const cancelNoShow = (matchId: string) =>
  authedRequest<unknown>(
    `/matches/${encodeURIComponent(matchId)}/cancel-no-show`,
    {
      method: "PATCH",
    },
  );

const declineOffer = (matchId: string) =>
  authedRequest<unknown>(`/matches/${encodeURIComponent(matchId)}/decline`, {
    method: "PATCH",
  });

export const matchServices = { volunteerForRequest, cancelNoShow, declineOffer, getMyOffers, withdrawOffer };

