"use server";

import { updateTag } from "next/cache";
import { bankServices } from "@/service/bank.service";



export const verifyBank = async (id: string) => {
  const res = await bankServices.verifyBank(id);
  if (!res.error) updateTag("blood-banks");
  return res;
};

export const rejectBank = async (id: string, note: string) => {
  const res = await bankServices.rejectBank(id, note);
  if (!res.error) updateTag("blood-banks");
  return res;
};
