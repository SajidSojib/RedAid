import { authedRequest } from "@/lib/server-api";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string | null;
  bloodType: string | null;
  status: "ACTIVE" | "SUSPENDED";
  suspensionReason: string | null;
  suspendedAt: string | null;
  donationCount: number;
  createdAt: string;
  reports: { pending: number; total: number };
};

export type AdminUsersPayload = {
  users: AdminUser[];
  counts: { active: number; suspended: number; reported: number };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const enc = encodeURIComponent;

// Not cached: the admin acts on these rows
const getUsers = (query: string) =>
  authedRequest<AdminUsersPayload>(`/users${query ? `?${query}` : ""}`);

const suspendUser = (id: string, note: string) =>
  authedRequest<unknown>(`/users/${enc(id)}/suspend`, {
    method: "PATCH",
    body: { note },
  });

const reactivateUser = (id: string) =>
  authedRequest<unknown>(`/users/${enc(id)}/reactivate`, { method: "PATCH" });

export const adminUserServices = { getUsers, suspendUser, reactivateUser };
