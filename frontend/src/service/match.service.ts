import { authedRequest } from "@/lib/server-api";

const volunteerForRequest = (requestId: string) =>
  authedRequest<unknown>(
    `/matches/requests/${encodeURIComponent(requestId)}/volunteer`,
    { method: "POST" },
  );

export const matchServices = { volunteerForRequest };
