import { authedRequest } from "@/lib/server-api";
import type { BankRequestStatus } from "@/service/bank-request.service";

export type BankOverview = {
  bank: {
    name: string;
    verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
    verificationNote: string | null;
  };
  counts: {
    pending: number;
    approved: number;
    fulfilled: number;
    bagsGiven: number;
  };
  stock: {
    items: { bloodType: string; unitsAvailable: number }[];
    out: number;
    low: number;
    total: number;
  };
  weekly: { weekStart: string; fulfilled: number; rejected: number }[];
  recent: {
    id: string;
    bloodType: string;
    unitsRequested: number;
    status: BankRequestStatus;
    createdAt: string;
    requester: { name: string };
  }[];
};

// Not cached: the owner acts on these numbers and expects them to be current
const getBankOverview = () => authedRequest<BankOverview>("/overview/bank");

export const overviewServices = { getBankOverview };
