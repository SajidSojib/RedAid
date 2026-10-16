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
  matchStatus: "NOTIFIED" | "ACCEPTED" | "COMPLETED" | "CANCELLED" | null;
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
        console.log(errorData)
        throw new Error(errorData?.message || "Request failed");
    }

    const result = await res.json();
    return result;
}

const getRequests = (query: string) =>
  authedRequest<FeedPayload>(`/requests${query ? `?${query}` : ""}`);

export const requestServices = { createRequest, getRequests };
