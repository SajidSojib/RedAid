"use server";

import { refresh } from "next/cache";
import { matchServices } from "@/service/match.service";

export const volunteerForRequest = async (requestId: string) => {
  const result = await matchServices.volunteerForRequest(requestId);
  refresh();
  return result;
};
