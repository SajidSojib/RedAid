"use server";

import { updateTag } from "next/cache";
import { matchServices } from "@/service/match.service";

export const volunteerForRequest = async (requestId: string) => {
  const result = await matchServices.volunteerForRequest(requestId);
  if (!result.error) {
      updateTag("my-requests");
      updateTag("requests");
      updateTag("notifications");
    }
  return result;
};

export const markNoShow = async (matchId: string) => {
  const result = await matchServices.cancelNoShow(matchId);
  if (!result.error) {
    updateTag("my-requests");
    updateTag("requests");
    updateTag("notifications");
  }
  return result;
};

export const declineOffer = async (matchId: string) => {
  const result = await matchServices.declineOffer(matchId);
  if (!result.error) {
    updateTag("my-requests");
    updateTag("requests");
    updateTag("notifications");
  }
  return result;
};