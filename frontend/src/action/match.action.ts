"use server";

import { refresh } from "next/cache";
import { matchServices } from "@/service/match.service";

export const volunteerForRequest = async (requestId: string) => {
  const result = await matchServices.volunteerForRequest(requestId);
  refresh();
  return result;
};

export const markNoShow = async (matchId: string) => {
  const result = await matchServices.cancelNoShow(matchId);
  refresh();
  return result;
};

export const declineOffer = async (matchId: string) => {
  const result = await matchServices.declineOffer(matchId);
  refresh();
  return result;
};