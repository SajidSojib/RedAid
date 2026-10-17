"use server";

import { refresh } from "next/cache";
import { donationServices } from "@/service/donation.service";

export const confirmDonation = async (matchId: string) => {
  const result = await donationServices.confirmDonation(matchId);
  refresh();
  return result;
};
