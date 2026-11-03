"use server";

import { revalidatePath, updateTag } from "next/cache";
import {
  profileServices,
  type UpdateProfileInput,
} from "@/service/profile.service";

export const updateMyProfile = async (input: UpdateProfileInput) => {
  const res = await profileServices.updateMyProfile(input);
if (!res.error) {
  updateTag("top-donors");
  revalidatePath("/dashboard/profile");
}  return res;
};
