import { authedRequest } from "@/lib/server-api";

export type ConfirmDonationResult = {
  donationCount: number;
  earned: { badge: string; donations: number; certificate: boolean }[];
  requestCompleted: boolean;
};

const confirmDonation = (matchId: string) =>
  authedRequest<ConfirmDonationResult>(
    `/donations/matches/${encodeURIComponent(matchId)}/confirm`,
    { method: "PATCH" },
  );

export const donationServices = { confirmDonation };
