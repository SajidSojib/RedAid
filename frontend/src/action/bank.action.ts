"use server";

import { revalidatePath, updateTag } from "next/cache";
import { bankServices, UpdateBankInput } from "@/service/bank.service";



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

export const updateMyBank = async (input: UpdateBankInput) => {
  const res = await bankServices.updateMyBank(input);
  if (!res.error) {
    updateTag("blood-banks");
    revalidatePath("/dashboard/bank-profile");
  }
  return res;
};
