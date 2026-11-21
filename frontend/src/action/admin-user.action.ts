"use server";

import { revalidatePath, updateTag } from "next/cache";
import { adminUserServices } from "@/service/admin-user.service";

// A suspension cancels requests, offers and bank requests, so many lists change
const expire = () => {
  for (const tag of [
    "requests",
    "my-requests",
    "my-offers",
    "my-bank-requests",
    "notifications",
    "top-donors",
  ]) {
    updateTag(tag);
  }
  revalidatePath("/dashboard/users");
};

export const suspendUser = async (id: string, note: string) => {
  const res = await adminUserServices.suspendUser(id, note);
  if (!res.error) expire();
  return res;
};

export const reactivateUser = async (id: string) => {
  const res = await adminUserServices.reactivateUser(id);
  if (!res.error) expire();
  return res;
};
