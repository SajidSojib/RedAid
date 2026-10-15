import { env } from "@/env";
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

export const requestServices = { createRequest };
