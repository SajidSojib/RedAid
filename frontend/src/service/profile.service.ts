import { authedRequest } from "@/lib/server-api";

type Ref = { id: string; name: string; bn_name: string };

export type ProfileArea = {
  id: string;
  upazilaId: string;
  unionId: string | null;
  upazila: Ref;
  union: Ref | null;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  phone: string;
  bloodType: string | null;
  lastDonationDate: string | null;
  donationCount: number;
  donorServiceAreas: ProfileArea[];
};

export type UpdateProfileInput = {
  name?: string;
  phone?: string;
  image?: string;
  bloodType?: string;
  lastDonationDate?: string | null;
  serviceAreas?: { upazilaId: string; unionId: string | null }[];
};

const getMyProfile = () => authedRequest<Profile>("/profile");

const updateMyProfile = (input: UpdateProfileInput) =>
  authedRequest<unknown>("/profile", { method: "PATCH", body: input });

export const profileServices = { getMyProfile, updateMyProfile };
