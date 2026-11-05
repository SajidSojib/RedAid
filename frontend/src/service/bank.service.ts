import { authedRequest } from "@/lib/server-api";

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type AdminBank = {
  id: string;
  name: string;
  address: string;
  phone: string;
  licenseNumber: string;
  latitude: number | null;
  longitude: number | null;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
  verifiedAt: string | null;
  createdAt: string;
  inventory: { bloodType: string; unitsAvailable: number; updatedAt: string }[];
  upazila: {
    id: string;
    name: string;
    bn_name: string;
    district: {
      id: string;
      name: string;
      division: { id: string; name: string };
    };
  };
  owner: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    phone: string;
    image: string | null;
    status: string;
    createdAt: string;
  };
};

export type AdminBanksPayload = {
  banks: AdminBank[];
  counts: Record<VerificationStatus, number>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type PublicBank = {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  verifiedAt: string | null;
  upazila: {
    id: string;
    name: string;
    bn_name: string;
    district: { id: string; name: string; bn_name: string };
  };
  inventory: { bloodType: string; unitsAvailable: number; updatedAt: string }[];
};

export type PublicBanksPayload = {
  banks: PublicBank[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type BanksPayload = AdminBanksPayload | PublicBanksPayload;


const getBanks = <T extends BanksPayload = PublicBanksPayload>(query: string) =>
  authedRequest<T>(`/banks${query ? `?${query}` : ""}`, {
    cache: { revalidate: 15, tags: ["blood-banks"] },
  });

const verifyBank = (id: string) =>
  authedRequest<unknown>(`/banks/${encodeURIComponent(id)}/verify`, {
    method: "PATCH",
  });

const rejectBank = (id: string, note: string) =>
  authedRequest<unknown>(`/banks/${encodeURIComponent(id)}/reject`, {
    method: "PATCH",
    body: { note },
  });

export const bankServices = { getBanks, verifyBank, rejectBank };
