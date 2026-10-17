import { authedRequest } from "@/lib/server-api";

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

export const matchServices = { volunteerForRequest, cancelNoShow, declineOffer };

