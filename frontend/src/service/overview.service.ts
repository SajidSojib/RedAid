import { authedRequest } from "@/lib/server-api";
import type { BankRequestStatus } from "@/service/bank-request.service";
import { VerificationStatus } from "./bank.service";

export type BankOverview = {
  bank: {
    name: string;
    verificationStatus: VerificationStatus;
    verificationNote: string | null;
    suspensionReason: string | null;
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

export type AdminOverview = {
  counts: {
    banks: Record<"PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED", number>;
    users: { active: number; suspended: number };
    donations: number;
    requests: Record<
      "OPEN" | "FULFILLED" | "COMPLETED" | "CANCELLED" | "EXPIRED",
      number
    >;
    activeBankRequests: number;
    pendingReports: number;
  };
  weekly: {
    weekStart: string;
    donations: number;
    signups: number;
    requests: number;
  }[];
  blood: { bloodType: string; demand: number; supply: number }[];
  pendingBanks: {
    id: string;
    name: string;
    createdAt: string;
    upazila: { name: string; district: { name: string } };
  }[];
  latestReports: {
    id: string;
    category: string;
    reason: string;
    createdAt: string;
    reporter: { name: string };
    reportedUser: { id: string; name: string } | null;
    reportedBank: { id: string; name: string } | null;
  }[];
};

// Not cached
const getAdminOverview = () => authedRequest<AdminOverview>("/overview/admin");

// Not cached
const getBankOverview = () => authedRequest<BankOverview>("/overview/bank");

export const overviewServices = { getBankOverview, getAdminOverview };
