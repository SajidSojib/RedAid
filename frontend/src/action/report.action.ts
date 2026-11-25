"use server";

import { revalidatePath } from "next/cache";
import {
  reportServices,
  type CreateReportInput,
  type ReportTarget,
} from "@/service/report.service";

// Plain reads for dialogs, always fresh
export const getReports = async (t: ReportTarget) =>
  reportServices.getReports(t);
export const getReportEligibility = async (t: ReportTarget) =>
  reportServices.getEligibility(t);

export const createReport = async (input: CreateReportInput) =>
  reportServices.createReport(input);

export const dismissReport = async (id: string) => {
  const res = await reportServices.dismissReport(id);
  if (!res.error) {
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/bank-management");
  }
  return res;
};

export const getReportSummary = async (t: ReportTarget) =>
  reportServices.getSummary(t);