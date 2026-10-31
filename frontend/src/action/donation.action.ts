"use server";

import { updateTag } from "next/cache";
import { donationServices } from "@/service/donation.service";

export const confirmDonation = async (matchId: string) => {
  const result = await donationServices.confirmDonation(matchId);
  if (!result.error) {
    updateTag("my-requests");
     updateTag("requests");
    updateTag("notifications");
    }
  return result;
};
