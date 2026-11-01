"use server";

import { updateTag } from "next/cache";
import { matchServices } from "@/service/match.service";

const expire = () => {
  updateTag("my-offers");
  updateTag("requests");
  updateTag("my-requests");
  updateTag("notifications");
};

export const volunteerForRequest = async (requestId: string) => {
  const res = await matchServices.volunteerForRequest(requestId);
  if (!res.error) expire();
  return res;
};

export const declineOffer = async (matchId: string) => {
  const res = await matchServices.declineOffer(matchId);
  if (!res.error) expire();
  return res;
};

export const withdrawOffer = async (matchId: string) => {
  const res = await matchServices.withdrawOffer(matchId);
  if (!res.error) expire();
  return res;
};

export const markNoShow = async (matchId: string) => {
  const res = await matchServices.cancelNoShow(matchId);
  if (!res.error) expire();
  return res;
};
