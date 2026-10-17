import { env } from "@/env";
import { authedRequest } from "@/lib/server-api";
import { cookies } from "next/headers";

export type RequestUrgency = "NORMAL" | "URGENT" | "CRITICAL";

export type CreateRequestInput = {
  bloodType: string;
  unitsNeeded: number;
  urgency: RequestUrgency;
  upazilaId: string;
  unionId: string | null;
  hospitalName: string;
  patientName: string | null;
  contactPhone: string | null;
  note: string | null;
};

export type CreateRequestResult = {
  request: { id: string; status: string };
  notifiedDonors: number;
  searchScope: "UNION" | "UPAZILA";
};

type LocationRef = { id: string; name: string; bn_name: string };

export type RequestViewer = {
  isOwner: boolean;
  matchStatus: "NOTIFIED" | "ACCEPTED" | "COMPLETED" | "CANCELLED" | "DECLINED" | "NO_SHOW" | null;
  canRespond: boolean;
  blockedReason: string | null;
};

export type FeedRequest = {
  id: string;
  bloodType: string;
  unitsNeeded: number;
  unitsAccepted: number;
  urgency: RequestUrgency;
  status: string;
  hospitalName: string | null;
  createdAt: string;
  upazila: LocationRef;
  union: LocationRef | null;
  patientName?: string | null; // only present for logged-in users
  note?: string | null;
  viewer: RequestViewer | null;
};

export type FeedPayload = {
  requests: FeedRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const API_URL = env.NEXT_PUBLIC_API_URL


export type RequestStatus =
  | "OPEN"
  | "FULFILLED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type MatchStatus =
  | "NOTIFIED"
  | "ACCEPTED"
  | "COMPLETED"
  | "CANCELLED"
  | "DECLINED"
  | "NO_SHOW";

export type MyRequest = {
  id: string;
  bloodType: string;
  unitsNeeded: number;
  unitsAccepted: number;
  urgency: RequestUrgency;
  status: RequestStatus;
  hospitalName: string | null;
  patientName: string | null;
  contactPhone: string | null;
  note: string | null;
  createdAt: string;
  upazila: LocationRef;
  union: LocationRef | null;
  _count: { matches: number };
  donors: { waiting: number; donated: number };
};

export type MyRequestsPayload = {
  requests: MyRequest[];
  openRequests: { used: number; limit: number };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type RequestDonor = {
  matchId: string;
  status: MatchStatus;
  respondedAt: string | null;
  donatedAt: string | null;
  donor: {
    id: string;
    name: string;
    image: string | null;
    bloodType: string | null;
    phone: string | null; // only present while the donor is active or has donated
  };
};

export type MyRequestDetails = Omit<
  MyRequest,
  "upazila" | "_count" | "donors"
> & {
  upazila: LocationRef & { district: LocationRef };
  donors: RequestDonor[];
  stats: { notified: number; waiting: number; donated: number; noShow: number };
  actions: {
    canEdit: boolean;
    canManageDonors: boolean;
    canComplete: boolean;
    canCancel: boolean;
  };
  locked: { bloodTypeAndArea: boolean };
};

export type UpdateRequestInput = {
  unitsNeeded?: number;
  urgency?: RequestUrgency;
  hospitalName?: string;
  patientName?: string | null;
  contactPhone?: string;
  note?: string | null;
};

const enc = encodeURIComponent;

const createRequest = async (input: CreateRequestInput) => {
  const cookieStore = await cookies();
  const res = await fetch(`${API_URL}/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieStore.toString(),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errorData = await res.json();
    console.log(errorData);
    throw new Error(errorData?.message || "Request failed");
  }

  const result = await res.json();
  return result;
};

const getRequests = (query: string) =>
  authedRequest<FeedPayload>(`/requests${query ? `?${query}` : ""}`);

const getMyRequests = (query: string) =>
  authedRequest<MyRequestsPayload>(`/requests/my${query ? `?${query}` : ""}`);

const getMyRequestDetails = (id: string) =>
  authedRequest<MyRequestDetails>(`/requests/my/${enc(id)}`);

const updateRequest = (id: string, input: UpdateRequestInput) =>
  authedRequest<unknown>(`/requests/${enc(id)}`, {
    method: "PATCH",
    body: input,
  });

const cancelRequest = (id: string) =>
  authedRequest<unknown>(`/requests/${enc(id)}/cancel`, { method: "PATCH" });

const completeRequest = (id: string) =>
  authedRequest<unknown>(`/requests/${enc(id)}/complete`, { method: "PATCH" });

export const requestServices = {
  createRequest,
  getRequests,
  getMyRequests,
  getMyRequestDetails,
  updateRequest,
  cancelRequest,
  completeRequest,
};
