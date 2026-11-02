import { authedRequest } from "@/lib/server-api";

export type ConfirmDonationResult = {
  donationCount: number;
  earned: { badge: string; donations: number; certificate: boolean }[];
  requestCompleted: boolean;
};

export type Donation = {
  id: string;
  units: number;
  donatedAt: string;
  request: {
    id: string;
    bloodType: string;
    hospitalName: string | null;
    upazila: { id: string; name: string; bn_name: string };
    union: { id: string; name: string; bn_name: string } | null;
  } | null; // null for donations not tied to a request
};

export type MyDonationsPayload = {
  donations: Donation[];
  summary: {
    donationCount: number;
    lastDonationDate: string | null;
    eligibility: {
      eligible: boolean;
      nextEligibleDate: string | null;
      daysLeft: number;
    };
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const getMyDonations = (query: string) =>
  authedRequest<MyDonationsPayload>(
    `/donations/my${query ? `?${query}` : ""}`,
    {
      cache: { revalidate: 15, tags: ["my-donations"] },
    },
  );

const confirmDonation = (matchId: string) =>
  authedRequest<ConfirmDonationResult>(
    `/donations/matches/${encodeURIComponent(matchId)}/confirm`,
    { method: "PATCH" },
  );

export const donationServices = { getMyDonations, confirmDonation };
