import { authedRequest } from "@/lib/server-api";

export type ReportTarget = { userId: string } | { bankId: string };

export type Report = {
  id: string;
  category: string;
  reason: string;
  status: "PENDING" | "DISMISSED" | "ACTION_TAKEN";
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  reporter: {
    id: string;
    name: string;
    image: string | null;
    role: string | null;
  };
};

export type ReportsPayload = {
  reports: Report[];
  pendingCount: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type Eligibility = {
  canReport: boolean;
  alreadyReported: boolean;
  reason: string | null;
};

export type CreateReportInput = ReportTarget & {
  category: string;
  reason: string;
};

const qs = (t: ReportTarget) =>
  "userId" in t
    ? `userId=${encodeURIComponent(t.userId)}`
    : `bankId=${encodeURIComponent(t.bankId)}`;

const getReports = (t: ReportTarget) =>
  authedRequest<ReportsPayload>(`/reports?${qs(t)}&limit=50`);

const getEligibility = (t: ReportTarget) =>
  authedRequest<Eligibility>(`/reports/eligibility?${qs(t)}`);

const createReport = (input: CreateReportInput) =>
  authedRequest<unknown>("/reports", { method: "POST", body: input });

const dismissReport = (id: string, note?: string) =>
  authedRequest<unknown>(`/reports/${encodeURIComponent(id)}/dismiss`, {
    method: "PATCH",
    body: { note },
  });

export const reportServices = {
  getReports,
  getEligibility,
  createReport,
  dismissReport,
};
