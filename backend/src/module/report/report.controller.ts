import type { Request, Response } from "express";
import {
  reportServices,
  ReportTarget,
  type CreateReportInput,
  type GetReportsFilters,
} from "./report.service";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

const reporter = (req: Request) => ({
  id: req.user!.id,
  role: req.user!.role ?? null,
});

const getEligibility = asyncHandler(async (req: Request, res: Response) => {
  const userId = str(req.query.userId);
  const bankId = str(req.query.bankId);

  const target: ReportTarget = {};

  if (userId !== undefined) {
    target.userId = userId;
  }

  if (bankId !== undefined) {
    target.bankId = bankId;
  }

  const result = await reportServices.getEligibility(reporter(req), target);

  return new ApiResponse(
    200,
    result,
    "Report eligibility retrieved successfully",
  ).send(res);
});

const createReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportServices.createReport(
    reporter(req),
    req.body as CreateReportInput,
  );

  return new ApiResponse(
    201,
    report,
    "Report sent. An admin will review it.",
  ).send(res);
});

const getReports = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportServices.getReports(
    req.query as unknown as GetReportsFilters,
  );

  return new ApiResponse(200, result, "Reports retrieved successfully").send(
    res,
  );
});

const dismissReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportServices.dismissReport(
    req.params.reportId as string,
    req.body?.note,
  );

  return new ApiResponse(200, report, "Report dismissed successfully").send(
    res,
  );
});

const summarizeReports = asyncHandler(async (req: Request, res: Response) => {
  const userId = str(req.query.userId);
  const bankId = str(req.query.bankId);

  const result = await reportServices.summarizeReports({
    ...(userId && { userId }),
    ...(bankId && { bankId }),
  });

  return new ApiResponse(200, result, "Summary created successfully").send(res);
});

export const reportControllers = {
  getEligibility,
  createReport,
  getReports,
  dismissReport,
  summarizeReports,
};
