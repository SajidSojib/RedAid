import { authedRequest } from "@/lib/server-api";

export type CreateBankRequestInput = {
  bankId: string;
  bloodType: string;
  unitsRequested: number;
  note: string | null;
  donationRequestId?: string | null;
};

export type BankRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "FULFILLED"
  | "CANCELLED"
  | "WITHDRAWN"
  | "NO_SHOW";

export type IncomingRequest = {
  id: string;
  bloodType: string;
  unitsRequested: number;
  status: BankRequestStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  stock: number;
  requester: { id: string; name: string; phone: string; image: string | null };
  donationRequest: { id: string; hospitalName: string | null } | null;
};

export type IncomingPayload = {
  requests: IncomingRequest[];
  counts: { pending: number; approved: number };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type MyBankRequest = {
  id: string;
  bankId: string;
  bloodType: string;
  unitsRequested: number;
  status: BankRequestStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  bank: { id: string; name: string; phone: string; address: string };
  donationRequest: { id: string; hospitalName: string | null } | null;
};

export type MyBankRequestsPayload = {
  requests: MyBankRequest[];
  activeRequests: { used: number; limit: number };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
const enc = encodeURIComponent;

// Not cached: the owner acts on these and must see the latest status
const getIncomingBankRequests = (query: string) =>
  authedRequest<IncomingPayload>(
    `/bank-requests/incoming${query ? `?${query}` : ""}`,
  );

const approveBankRequest = (id: string) =>
  authedRequest<unknown>(`/bank-requests/${enc(id)}/approve`, {
    method: "PATCH",
  });

const withdrawBankRequest = (id: string) =>
  authedRequest<unknown>(`/bank-requests/${encodeURIComponent(id)}/withdraw`, {
    method: "PATCH",
  });

const rejectBankRequest = (id: string) =>
  authedRequest<unknown>(`/bank-requests/${enc(id)}/reject`, {
    method: "PATCH",
  });

const completeBankRequest = (id: string) =>
  authedRequest<unknown>(`/bank-requests/${enc(id)}/complete`, {
    method: "PATCH",
  });

const markBankRequestNoShow = (id: string) =>
  authedRequest<unknown>(`/bank-requests/${enc(id)}/no-show`, {
    method: "PATCH",
  });

// scope=active | history, plus page and limit
const getMyBankRequests = (query: string) =>
  authedRequest<MyBankRequestsPayload>(
    `/bank-requests/my${query ? `?${query}` : ""}`,
    { cache: { revalidate: 15, tags: ["my-bank-requests"] } },
  );

const createBankRequest = (input: CreateBankRequestInput) =>
  authedRequest<unknown>("/bank-requests", { method: "POST", body: input });

export const bankRequestServices = { createBankRequest, withdrawBankRequest, getMyBankRequests, getIncomingBankRequests, approveBankRequest, rejectBankRequest, completeBankRequest, markBankRequestNoShow };
